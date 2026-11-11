/* 산불신호등 현장 화면 언어 — 휴대폰 언어를 보고 자동으로 고름(외국인 작업자용)
   새 언어는 LANGS와 T에 한 덩어리씩 추가하면 됨. lv/lvTodo 순서는 common.js LEVELS와 같음(낮음→매우높음) */
'use strict';

const LANGS = [
  ['ko', '한국어', 'ko-KR'], ['en', 'English', 'en-US'], ['zh', '中文', 'zh-CN'], ['vi', 'Tiếng Việt', 'vi-VN'],
  ['th', 'ไทย', 'th-TH'], ['id', 'Bahasa Indonesia', 'id-ID'], ['ru', 'Русский', 'ru-RU'],
];

const T = {
  ko: {
    title: '산불신호등 · 불티 작업 전 확인',
    lv: ['낮음', '다소높음', '높음', '매우높음'],
    lvTodo: ['평소 절차대로 작업', '불티받이포·소화기 확인 후 작업', '화재감시자를 따로 두고 작업', '숲 옆 불티 작업 멈추고 감독자에게 연락'],
    far: '숲과 먼 곳', farTodo: '숲과 멀어 평소 절차대로 작업',
    unk: '확인 불가', unkTodo: '예보를 확인할 수 없음 · 감독자에게 확인 후 작업',
    forest: '숲까지', forestNone: '확인 안 됨(숲 옆으로 보고 판단)', forestIn: '숲 안', forestAbout: '약 {d}m', beyond: '({m}m 밖)',
    risk: '지역 산불위험', index: '지수', fcAt: '({t} 예보)',
    call: '감독자에게 전화', slots: '작업 시간대 예보', past: '지남', noFc: '예보 자료가 없습니다.',
    staleOld: '예보 자료가 {u} 이후로 갱신되지 않았습니다.', late: '예보 자료가 {u} 이후로 갱신되지 않아, 그때 받은 예보로 안내합니다.', staleNone: '이 지역은 지금 시각의 예보가 없습니다.', askSup: '감독자에게 확인하세요.',
    loadErr: '자료를 불러오지 못했습니다 — 잠시 뒤 다시 열어 주세요.',
    notFound: '이 현장의 지역 예보 자료를 찾지 못했습니다. QR을 다시 만들어 주세요.',
    foot1: '자료: {src} · 시군구 안 가장 위험한 곳(최댓값) 기준 · 숲 위치는 산림청 임상도(1:5,000)',
    foot2: '자료 갱신 {u} · 3시간마다 자동 갱신',
    hint: '현장마다 붙은 QR을 찍으면 그 현장의 숲까지 거리와 할 일이 나옵니다.',
  },
  en: {
    title: 'Wildfire Signal · Check before hot work',
    lv: ['Low', 'Moderate', 'High', 'Very high'],
    lvTodo: ['Work as usual', 'Check the spark blanket and fire extinguisher, then work', 'Work only with a separate fire watcher', 'Stop spark work near the forest and call your supervisor'],
    far: 'Away from forest', farTodo: 'Far from the forest — work as usual',
    unk: 'Unknown', unkTodo: 'Forecast unavailable — ask your supervisor before working',
    forest: 'Distance to forest', forestNone: 'Not checked (treated as next to forest)', forestIn: 'Inside forest', forestAbout: 'about {d} m', beyond: '(beyond {m} m)',
    risk: 'Area wildfire risk', index: 'index', fcAt: '(forecast {t})',
    call: 'Call supervisor', slots: 'Forecast for work hours', past: 'past', noFc: 'No forecast data.',
    staleOld: 'The forecast has not been updated since {u}.', late: 'The forecast has not been updated since {u}; showing the forecast received then.', staleNone: 'There is no forecast for this time in this area.', askSup: 'Check with your supervisor.',
    loadErr: 'Could not load data — please try again shortly.',
    notFound: 'No forecast data found for this site. Ask your supervisor to make a new QR code.',
    foot1: 'Data: {src} (Korea Forest Service) · highest risk in the district · forest from the KFS forest type map (1:5,000)',
    foot2: 'Updated {u} (Korea time) · auto-updated every 3 hours',
    hint: 'Scan the QR code posted at each site to see its distance to the forest and what to do.',
  },
  zh: {
    title: '山火信号灯 · 动火作业前确认',
    lv: ['低', '较高', '高', '极高'],
    lvTodo: ['按正常程序作业', '确认防火毯和灭火器后再作业', '须另设专人监火后再作业', '停止树林旁的动火作业，并联系主管'],
    far: '远离树林', farTodo: '远离树林，按正常程序作业',
    unk: '无法确认', unkTodo: '无法确认预报，请先向主管确认再作业',
    forest: '距树林', forestNone: '未确认（按紧邻树林处理）', forestIn: '在树林内', forestAbout: '约 {d} 米', beyond: '（{m} 米以外）',
    risk: '地区山火风险', index: '指数', fcAt: '（{t} 预报）',
    call: '致电主管', slots: '作业时段预报', past: '已过', noFc: '没有预报数据。',
    staleOld: '预报自 {u} 起未更新。', late: '预报自 {u} 起未更新，以下按当时收到的预报显示。', staleNone: '该地区没有当前时段的预报。', askSup: '请向主管确认。',
    loadErr: '无法加载数据，请稍后再试。',
    notFound: '找不到该现场的地区预报数据。请让主管重新制作二维码。',
    foot1: '数据：{src}（韩国山林厅）· 以市郡区内最高风险值为准 · 树林位置来自山林厅林相图(1:5,000)',
    foot2: '更新时间 {u}（韩国时间）· 每3小时自动更新',
    hint: '扫描各现场张贴的二维码，即可查看该现场距树林的距离和应做事项。',
  },
  vi: {
    title: 'Đèn báo cháy rừng · Kiểm tra trước khi làm việc phát tia lửa',
    lv: ['Thấp', 'Hơi cao', 'Cao', 'Rất cao'],
    lvTodo: ['Làm việc theo quy trình thường lệ', 'Kiểm tra bạt chống cháy và bình chữa cháy rồi mới làm', 'Chỉ làm khi có người giám sát lửa riêng', 'Dừng việc phát tia lửa gần rừng và gọi người giám sát'],
    far: 'Xa rừng', farTodo: 'Xa rừng — làm việc theo quy trình thường lệ',
    unk: 'Không rõ', unkTodo: 'Không có dự báo — hỏi người giám sát trước khi làm',
    forest: 'Khoảng cách đến rừng', forestNone: 'Chưa xác định (coi như sát rừng)', forestIn: 'Trong rừng', forestAbout: 'khoảng {d} m', beyond: '(ngoài {m} m)',
    risk: 'Nguy cơ cháy rừng khu vực', index: 'chỉ số', fcAt: '(dự báo {t})',
    call: 'Gọi người giám sát', slots: 'Dự báo theo giờ làm việc', past: 'đã qua', noFc: 'Không có dữ liệu dự báo.',
    staleOld: 'Dự báo chưa được cập nhật từ {u}.', late: 'Dự báo chưa được cập nhật từ {u}; đang hiển thị theo dự báo nhận lúc đó.', staleNone: 'Khu vực này không có dự báo cho thời điểm hiện tại.', askSup: 'Hãy hỏi người giám sát.',
    loadErr: 'Không tải được dữ liệu — vui lòng thử lại sau.',
    notFound: 'Không tìm thấy dữ liệu dự báo cho công trường này. Hãy nhờ người giám sát tạo lại mã QR.',
    foot1: 'Dữ liệu: {src} (Cục Lâm nghiệp Hàn Quốc) · theo mức nguy cơ cao nhất trong quận/huyện · vị trí rừng theo bản đồ loại rừng (1:5.000)',
    foot2: 'Cập nhật {u} (giờ Hàn Quốc) · tự động cập nhật mỗi 3 giờ',
    hint: 'Quét mã QR dán tại mỗi công trường để xem khoảng cách đến rừng và việc cần làm.',
  },
  th: {
    title: 'สัญญาณไฟป่า · ตรวจก่อนทำงานที่เกิดสะเก็ดไฟ',
    lv: ['ต่ำ', 'ค่อนข้างสูง', 'สูง', 'สูงมาก'],
    lvTodo: ['ทำงานตามขั้นตอนปกติ', 'ตรวจผ้ากันสะเก็ดไฟและถังดับเพลิงก่อนทำงาน', 'ต้องมีผู้เฝ้าระวังไฟแยกต่างหากขณะทำงาน', 'หยุดงานที่เกิดสะเก็ดไฟใกล้ป่าและโทรหาหัวหน้างาน'],
    far: 'ห่างจากป่า', farTodo: 'ห่างจากป่า ทำงานตามขั้นตอนปกติ',
    unk: 'ไม่ทราบ', unkTodo: 'ไม่มีข้อมูลพยากรณ์ สอบถามหัวหน้างานก่อนทำงาน',
    forest: 'ระยะถึงป่า', forestNone: 'ไม่ทราบ (ถือว่าอยู่ติดป่า)', forestIn: 'อยู่ในป่า', forestAbout: 'ประมาณ {d} ม.', beyond: '(เกิน {m} ม.)',
    risk: 'ความเสี่ยงไฟป่าในพื้นที่', index: 'ดัชนี', fcAt: '(พยากรณ์ {t})',
    call: 'โทรหาหัวหน้างาน', slots: 'พยากรณ์ช่วงเวลาทำงาน', past: 'ผ่านแล้ว', noFc: 'ไม่มีข้อมูลพยากรณ์',
    staleOld: 'ข้อมูลพยากรณ์ไม่ได้อัปเดตตั้งแต่ {u}', late: 'ข้อมูลพยากรณ์ไม่ได้อัปเดตตั้งแต่ {u} จึงแสดงตามพยากรณ์ที่ได้รับในขณะนั้น', staleNone: 'พื้นที่นี้ไม่มีพยากรณ์สำหรับเวลานี้', askSup: 'โปรดสอบถามหัวหน้างาน',
    loadErr: 'โหลดข้อมูลไม่ได้ โปรดลองใหม่อีกครั้ง',
    notFound: 'ไม่พบข้อมูลพยากรณ์ของไซต์นี้ โปรดให้หัวหน้างานสร้าง QR ใหม่',
    foot1: 'ข้อมูล: {src} (กรมป่าไม้เกาหลี) · ใช้ค่าความเสี่ยงสูงสุดในเขต · ตำแหน่งป่าจากแผนที่ประเภทป่า (1:5,000)',
    foot2: 'อัปเดต {u} (เวลาเกาหลี) · อัปเดตอัตโนมัติทุก 3 ชั่วโมง',
    hint: 'สแกน QR ที่ติดไว้ในแต่ละไซต์เพื่อดูระยะถึงป่าและสิ่งที่ต้องทำ',
  },
  id: {
    title: 'Sinyal Kebakaran Hutan · Cek sebelum kerja percikan api',
    lv: ['Rendah', 'Agak tinggi', 'Tinggi', 'Sangat tinggi'],
    lvTodo: ['Bekerja sesuai prosedur biasa', 'Periksa kain tahan api dan alat pemadam api, lalu bekerja', 'Bekerja hanya dengan pengawas api khusus', 'Hentikan pekerjaan percikan api di dekat hutan dan hubungi pengawas'],
    far: 'Jauh dari hutan', farTodo: 'Jauh dari hutan — bekerja sesuai prosedur biasa',
    unk: 'Tidak diketahui', unkTodo: 'Prakiraan tidak tersedia — tanyakan pengawas sebelum bekerja',
    forest: 'Jarak ke hutan', forestNone: 'Tidak diketahui (dianggap dekat hutan)', forestIn: 'Di dalam hutan', forestAbout: 'sekitar {d} m', beyond: '(lebih dari {m} m)',
    risk: 'Risiko kebakaran hutan wilayah', index: 'indeks', fcAt: '(prakiraan {t})',
    call: 'Telepon pengawas', slots: 'Prakiraan jam kerja', past: 'lewat', noFc: 'Tidak ada data prakiraan.',
    staleOld: 'Prakiraan belum diperbarui sejak {u}.', late: 'Prakiraan belum diperbarui sejak {u}; ditampilkan berdasarkan prakiraan saat itu.', staleNone: 'Tidak ada prakiraan untuk waktu ini di wilayah ini.', askSup: 'Tanyakan kepada pengawas.',
    loadErr: 'Gagal memuat data — coba lagi sebentar lagi.',
    notFound: 'Data prakiraan untuk lokasi ini tidak ditemukan. Minta pengawas membuat QR baru.',
    foot1: 'Data: {src} (Dinas Kehutanan Korea) · berdasarkan risiko tertinggi di distrik · lokasi hutan dari peta tipe hutan (1:5.000)',
    foot2: 'Diperbarui {u} (waktu Korea) · otomatis setiap 3 jam',
    hint: 'Pindai QR yang ditempel di setiap lokasi untuk melihat jarak ke hutan dan apa yang harus dilakukan.',
  },
  ru: {
    title: 'Сигнал лесного пожара · Проверка перед огневыми работами',
    lv: ['Низкий', 'Повышенный', 'Высокий', 'Очень высокий'],
    lvTodo: ['Работайте в обычном порядке', 'Проверьте огнезащитное полотно и огнетушитель, затем работайте', 'Работайте только с отдельным наблюдающим за огнём', 'Прекратите работы с искрами рядом с лесом и позвоните руководителю'],
    far: 'Далеко от леса', farTodo: 'Далеко от леса — работайте в обычном порядке',
    unk: 'Нет данных', unkTodo: 'Прогноз недоступен — уточните у руководителя перед работой',
    forest: 'До леса', forestNone: 'Не определено (считается рядом с лесом)', forestIn: 'В лесу', forestAbout: 'около {d} м', beyond: '(дальше {m} м)',
    risk: 'Пожарная опасность в районе', index: 'индекс', fcAt: '(прогноз на {t})',
    call: 'Позвонить руководителю', slots: 'Прогноз на рабочие часы', past: 'прошло', noFc: 'Нет данных прогноза.',
    staleOld: 'Прогноз не обновлялся с {u}.', late: 'Прогноз не обновлялся с {u}; показан прогноз, полученный тогда.', staleNone: 'Для этого района нет прогноза на текущее время.', askSup: 'Уточните у руководителя.',
    loadErr: 'Не удалось загрузить данные — попробуйте чуть позже.',
    notFound: 'Данные прогноза для этого объекта не найдены. Попросите руководителя сделать новый QR-код.',
    foot1: 'Данные: {src} (Лесная служба Кореи) · по наибольшему риску в районе · лес по карте типов леса (1:5 000)',
    foot2: 'Обновлено {u} (время Кореи) · автообновление каждые 3 часа',
    hint: 'Отсканируйте QR-код на объекте, чтобы увидеть расстояние до леса и что нужно делать.',
  },
};

function pickLang(q) {
  const p = String(q.get('lang') || '').toLowerCase();
  if (T[p]) return p;
  try { const s = localStorage.getItem('fs-lang'); if (T[s]) return s; } catch (e) {}
  const list = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || 'ko'];
  for (const l of list) { const b = String(l).toLowerCase().split('-')[0]; if (T[b]) return b; }
  return 'en';                                   // 지원하지 않는 언어의 휴대폰은 영어로
}
function saveLang(l) { try { localStorage.setItem('fs-lang', l); } catch (e) {} }
function fmt(s, v) { return String(s).replace(/\{(\w+)\}/g, (_, k) => (v && k in v ? v[k] : '')); }
function localeOf(l) { const x = LANGS.find(a => a[0] === l); return x ? x[2] : 'en-US'; }

// 등급 객체(LEVELS/FAR/UNKNOWN) → 그 언어의 이름·할 일
function lvText(lv, l) {
  const t = T[l] || T.ko, i = LEVELS.indexOf(lv);
  if (i >= 0) return { name: t.lv[i], todo: t.lvTodo[i] };
  if (lv === FAR) return { name: t.far, todo: t.farTodo };
  return { name: t.unk, todo: t.unkTodo };
}
function dayLabelL(d, l) {
  if (l === 'ko') return dayLabel(d);
  try { return new Intl.DateTimeFormat(localeOf(l), { timeZone: 'Asia/Seoul', weekday: 'short', month: 'numeric', day: 'numeric' }).format(d); }
  catch (e) { return dayLabel(d); }
}
function timeLabelL(d, l) {
  if (l === 'ko') return timeLabel(d);
  const h = kstParts(d).h;
  try { return new Intl.DateTimeFormat(localeOf(l), { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' }).format(d) + ` ${h}:00`; }
  catch (e) { const p = kstParts(d); return `${p.mo}/${p.d} ${h}:00`; }
}
function hourLabel(h, l) { return l === 'ko' ? `${h}시` : `${h}:00`; }
