/* 산불신호등 공통 — 등급 기준, 자료 읽기, 숲까지 거리 계산 */
'use strict';

// 산불위험예보지수 등급(산림청 기준: 낮음 ~50, 다소높음 51~65, 높음 66~85, 매우높음 86~)
// 할 일 문구는 현장 기준에 맞게 고쳐 쓰면 됨
const LEVELS = [
  { max: 50,       name: '낮음',     color: '#2e7d32', todo: '평소 절차대로 작업' },
  { max: 65,       name: '다소높음', color: '#e0a100', todo: '불티받이포·소화기 확인 후 작업' },
  { max: 85,       name: '높음',     color: '#e65100', todo: '화재감시자를 따로 두고 작업' },
  { max: Infinity, name: '매우높음', color: '#c62828', todo: '숲 옆 불티 작업 멈추고 감독자에게 연락' },
];
const FAR = { name: '숲과 먼 곳', color: '#607d8b', todo: '숲과 멀어 평소 절차대로 작업' };
const UNKNOWN = { name: '확인 불가', color: '#757575', todo: '예보를 확인할 수 없음 · 감독자에게 확인 후 작업' };
const NEAR_M = 100;          // 이 거리(m) 안에 숲이 있으면 '숲 옆 현장'으로 봄
const WORK_HOURS = [9, 12, 15, 18];
const STALE_H = 12;          // 자료를 받은 지 이 시간이 넘으면 '확인 불가'
const WD = '일월화수목금토';

// 기본 현장(캠퍼스 대표 지점)
const CAMPUSES = [
  { id: 'nsc', n: '자연과학캠퍼스', sg: '41110', lat: 37.2939, lng: 126.9743 },
  { id: 'hsc', n: '인문사회과학캠퍼스', sg: '11110', lat: 37.5880, lng: 126.9930 },
];

function levelOf(v) { return LEVELS.find(l => v <= l.max); }

function parseKst(t) {               // "2026-11-10 12" 또는 "2026-11-10 14:37" → Date
  const m = String(t).match(/(\d{4})-?(\d{2})-?(\d{2})\D*(\d{1,2})?(?::(\d{2}))?/);
  if (!m) return null;
  const hh = String(m[4] || '0').padStart(2, '0'), mm = m[5] || '00';
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T${hh}:${mm}:00+09:00`);
  return isNaN(d) ? null : d;
}

function kstParts(d) {
  const k = new Date(d.getTime() + 9 * 3600e3);
  return { y: k.getUTCFullYear(), mo: k.getUTCMonth() + 1, d: k.getUTCDate(), h: k.getUTCHours(), wd: k.getUTCDay() };
}
function dayKey(d) { const p = kstParts(d); return `${p.y}-${p.mo}-${p.d}`; }
function dayLabel(d) { const p = kstParts(d); return `${p.mo}/${p.d}(${WD[p.wd]})`; }
function timeLabel(d) { const p = kstParts(d); return `${p.mo}/${p.d} ${p.h}시`; }

async function loadFire() {
  const r = await fetch('data/fire.json?v=' + Math.floor(Date.now() / 600000), { cache: 'no-store' });
  if (!r.ok) throw new Error('자료를 불러오지 못했습니다');
  return r.json();
}

function hasRegion(fire, sg) { return !!sg && Object.prototype.hasOwnProperty.call(fire.regions, sg); }

// 한 시군구의 지금 등급과 앞으로 3일(작업시간) 정리
//  지금 값 = 직전 예보와 다음 예보 중 높은 값(3시간 사이에 위험이 오르는 경우를 놓치지 않도록)
function summarize(region, fire, now = new Date()) {
  if (!region || !Array.isArray(region.rows)) return null;
  const rows = region.rows.map(r => ({ t: parseKst(r[0]), max: r[1], avg: r[2], hi: (r[5] || 0) + (r[6] || 0) }))
    .filter(r => r.t && Number.isFinite(r.max)).sort((a, b) => a.t - b.t);
  if (!rows.length) return null;
  // 예보 범위(받은 시점의 현재값 + 72시간)를 넘는 행은 버림 — 범위 밖 값은 기본값으로 채워져 있음
  const updated = fire && parseKst(fire.updated);
  const base = (updated && rows.filter(r => r.t <= updated).pop()) || rows[0];
  const inRange = rows.filter(r => r.t >= base.t && r.t <= new Date(base.t.getTime() + 75 * 3600e3));
  if (inRange.length) rows.splice(0, rows.length, ...inRange);
  const prev = rows.filter(r => r.t <= now).pop() || null;
  const next = rows.find(r => r.t > now) || null;
  const near = [prev, next].filter(r => r && Math.abs(r.t - now) <= 6 * 3600e3);
  const cur = near.length ? near.reduce((a, b) => (b.max > a.max ? b : a)) : null;
  const dataOld = !updated || (now - updated) > STALE_H * 3600e3;
  const days = [];
  for (const r of rows) {
    if (r.t < new Date(now.getTime() - 2 * 3600e3)) continue;
    const h = kstParts(r.t).h;
    if (!WORK_HOURS.includes(h)) continue;
    const k = dayKey(r.t);
    let d = days.find(x => x.k === k);
    if (!d) { d = { k, t: r.t, label: dayLabel(r.t), slots: [] }; days.push(d); }
    d.slots.push({ h, max: r.max });
  }
  return { cur, days: days.slice(0, 3), stale: !cur || dataOld, dataOld, updated, latest: rows[rows.length - 1].t };
}

// ── 점이 폴리곤 안인지, 숲까지 거리(m) ──
function toXY(lat, lng, lat0) {
  const R = 6371008.8, rad = Math.PI / 180;
  return [lng * rad * R * Math.cos(lat0 * rad), lat * rad * R];
}
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
  let t = L ? ((px - ax) * dx + (py - ay) * dy) / L : 0;
  t = Math.max(0, Math.min(1, t));
  const x = ax + t * dx - px, y = ay + t * dy - py;
  return Math.sqrt(x * x + y * y);
}
function inRing(px, py, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}
function polysOf(g) { return !g ? [] : g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []; }
function inGeometry(lat, lng, g) {        // 경위도 그대로 판단(작은 범위라 충분)
  return polysOf(g).some(poly => inRing(lng, lat, poly[0]) && !poly.slice(1).some(h => inRing(lng, lat, h)));
}
function forestDistance(lat, lng, geo) {
  if (!geo || !geo.features) return null;
  const [px, py] = toXY(lat, lng, lat);
  let best = Infinity;
  for (const f of geo.features) {
    for (const poly of polysOf(f.geometry)) {
      const rings = poly.map(r => r.map(([x, y]) => toXY(y, x, lat)));
      if (inRing(px, py, rings[0]) && !rings.slice(1).some(h => inRing(px, py, h))) return 0;
      for (const ring of rings)
        for (let i = 1; i < ring.length; i++)
          best = Math.min(best, segDist(px, py, ring[i - 1][0], ring[i - 1][1], ring[i][0], ring[i][1]));
    }
  }
  return isFinite(best) ? Math.round(best) : null;
}

function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
