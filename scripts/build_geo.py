"""산불신호등 지도 자료 만들기 (한 번만 돌리면 됨, 자동 갱신과 무관)

  python scripts/build_geo.py <행정동경계.geojson> <임상도폴더> <fire.json>

만드는 파일
  data/sigungu.json        전국 시군구 경계(산불위험예보 지역코드 기준) — 감독자 화면에서 누른 곳의 지역 자동 선택
  data/forest/index.json   숲 자료가 있는 구 목록과 범위
  data/forest/<구코드>.json 그 구의 숲(임상도 침엽수림·활엽수림·혼효림) 경계와, 숲 거리를 믿을 수 있는 범위(cover)

입력
  행정동 경계: vuski/admdongkor HangJeongDong_ver20250101.geojson
  임상도: 산림공간정보서비스에서 시군구별로 받은 2024년 임상도(1:5,000) SHP, <임상도폴더>/z<구코드>/<구코드>.shp
  fire.json: 지역코드·이름 확인용(산불위험예보는 2026년 코드: 전남광주통합특별시 12xxx, 인천 제물포·영종·서해·검단구)
"""
import json, os, re, sys, glob, warnings
warnings.filterwarnings('ignore', category=DeprecationWarning)
import shapefile
from shapely.geometry import shape, mapping, box, MultiPolygon, Polygon
from shapely.ops import unary_union, transform
from pyproj import Transformer

NEAR_M = 100
TO_M = Transformer.from_crs(4326, 5179, always_xy=True).transform
TO_LL = Transformer.from_crs(5179, 4326, always_xy=True).transform

# 2026년 인천 행정체제 개편(2025 경계 → 2026 산불위험예보 코드)
INCHEON = {
    '28155': {'영종동', '영종1동', '영종2동', '운서동', '용유동'},                        # 영종구 ← 중구 영종도
    '28290': {'검단동', '불로대곡동', '원당동', '당하동', '오류왕길동', '마전동', '아라동'},  # 검단구 ← 서구 북부
}


def rnd(geom, nd):
    def r(c):
        return [round(c[0], nd), round(c[1], nd)]
    g = mapping(geom)
    if g['type'] == 'Polygon':
        return {'type': 'Polygon', 'coordinates': [[r(c) for c in ring] for ring in g['coordinates']]}
    return {'type': 'MultiPolygon', 'coordinates': [[[r(c) for c in ring] for ring in poly] for poly in g['coordinates']]}


def polys(g):
    if g.is_empty:
        return MultiPolygon()
    if isinstance(g, Polygon):
        return MultiPolygon([g])
    if isinstance(g, MultiPolygon):
        return g
    return MultiPolygon([p for p in getattr(g, 'geoms', []) if isinstance(p, Polygon)])


def fire_code(p, fire):
    sgg, nm = p['sgg'], p['adm_nm'].split()[-1]
    if sgg in ('28110', '28140'):
        return '28155' if nm in INCHEON['28155'] else '28125'          # 제물포구
    if sgg == '28260':
        return '28290' if nm in INCHEON['28290'] else '28275'          # 서해구
    if p['sido'] in ('29', '46'):                                       # 광주·전남 → 전남광주통합특별시
        want = '전남광주통합특별시 ' + p['sggnm']
        for c, r in fire.items():
            if c.startswith('12') and r['name'] == want:
                return c
        return None
    if sgg in fire:
        return sgg
    if sgg[:4] + '0' in fire:                                            # 일반구 → 시(수원시 41110 등)
        return sgg[:4] + '0'
    return None


def main(dong_path, forest_dir, fire_path, out='data'):
    fire = json.load(open(fire_path, encoding='utf-8'))['regions']
    dong = json.load(open(dong_path, encoding='utf-8'))['features']

    # 1) 전국 시군구(예보 코드 기준)
    groups, gu = {}, {}
    for f in dong:
        p = f['properties']
        c = fire_code(p, fire)
        g = shape(f['geometry']).buffer(0)
        if c:
            groups.setdefault(c, []).append(g)
        nm = re.sub(r'^(\S+시)(\S+구)$', r'\1 \2', p['sggnm'])        # 수원시장안구 → 수원시 장안구
        gu.setdefault(p['sgg'], {'name': f"{p['sidonm']} {nm}", 'g': []})['g'].append(g)
    missing = sorted(set(fire) - set(groups))
    if missing:
        sys.exit(f'경계를 찾지 못한 예보 지역: {missing}')
    items = []
    for c in sorted(groups):
        g = polys(unary_union(groups[c]).simplify(0.002, preserve_topology=True))
        big = [q for q in g.geoms if q.area >= 2e-5] or list(g.geoms)      # 아주 작은 섬(약 0.2㎢ 미만)은 뺌
        g = MultiPolygon(big)
        items.append({'c': c, 'b': [round(v, 3) for v in g.bounds], 'g': rnd(g, 3)})
    os.makedirs(out, exist_ok=True)
    with open(os.path.join(out, 'sigungu.json'), 'w', encoding='utf-8') as fp:
        json.dump({'note': '시군구 경계(행정동 경계 vuski/admdongkor ver20250101을 산불위험예보 2026 지역코드로 합침, 약 200m 단순화, 0.2㎢ 미만 섬 제외)',
                   'items': items}, fp, ensure_ascii=False, separators=(',', ':'))

    # 2) 숲 자료가 있는 구
    codes = sorted(os.path.basename(d)[1:] for d in glob.glob(os.path.join(forest_dir, 'z*')))
    dist_m = {c: transform(TO_M, unary_union(gu[c]['g'])) for c in codes}
    cover_all = unary_union(list(dist_m.values())).buffer(-NEAR_M)      # 숲 자료 범위 안쪽 100m
    os.makedirs(os.path.join(out, 'forest'), exist_ok=True)
    index = []
    for c in codes:
        r = shapefile.Reader(os.path.join(forest_dir, f'z{c}', f'{c}.shp'), encoding='cp949')
        fi = [f[0] for f in r.fields[1:]].index('FRTP_CD')
        parts = [shape(s.__geo_interface__).buffer(0) for s, rec in zip(r.iterShapes(), r.iterRecords()) if str(rec[fi]).strip() in ('1', '2', '3')]
        forest = unary_union(parts).simplify(1.5, preserve_topology=True)
        cover = cover_all.intersection(dist_m[c]).simplify(5, preserve_topology=True)
        fire_c = fire_code({'sgg': c, 'adm_nm': '-', 'sido': c[:2], 'sggnm': gu[c]['name'].split()[-1]}, fire)
        rec = {'code': c, 'fire': fire_c, 'name': gu[c]['name'],
               'forest': rnd(polys(transform(TO_LL, forest)), 6),
               'cover': rnd(polys(transform(TO_LL, cover)), 6)}
        with open(os.path.join(out, 'forest', f'{c}.json'), 'w', encoding='utf-8') as fp:
            json.dump(rec, fp, ensure_ascii=False, separators=(',', ':'))
        bb = transform(TO_LL, dist_m[c]).bounds
        index.append({'code': c, 'fire': fire_c, 'name': gu[c]['name'], 'b': [round(v, 5) for v in bb]})
        print(c, gu[c]['name'], 'forest parts', len(parts), 'area km2', round(forest.area / 1e6, 2))
    with open(os.path.join(out, 'forest', 'index.json'), 'w', encoding='utf-8') as fp:
        json.dump({'source': '산림청 임상도 1:5,000 (2024년 임상도 2020~2024, 산림공간정보서비스) — 침엽수림·활엽수림·혼효림',
                   'note': f'숲 거리 자동 계산은 아래 구 안쪽 {NEAR_M}m까지. 그 밖은 감독자가 숲과의 거리를 고름',
                   'areas': index}, fp, ensure_ascii=False, separators=(',', ':'))


if __name__ == '__main__':
    main(*sys.argv[1:4])
