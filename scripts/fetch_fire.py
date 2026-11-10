# -*- coding: utf-8 -*-
"""
산림청 국립산림과학원_산불위험예보정보(공공데이터포털 15084817)에서
전국 시군구 산불위험예보지수(현재 + 72시간 예보)를 받아 data/fire.json 으로 저장한다.
GitHub Actions 가 15분마다 확인한다(자료가 2시간 30분 넘었을 때만 받음, 사무실 PC 예비 갱신도 같은 파일을 씀).
인증키는 환경변수 SERVICE_KEY(저장소 비밀값) 또는 인증키 파일 경로(첫 번째 인자)로만 받는다.
받은 자료가 온전하지 않으면(행 수가 모자라거나 지역이 너무 적으면) 기존 파일을 그대로 두고 실패로 끝낸다.
"""
import os, sys, json, time, math, datetime, urllib.request, urllib.parse

API = "https://apis.data.go.kr/1400377/forestPointV2/forestPointListSigunguSearchV2"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "fire.json")
KST = datetime.timezone(datetime.timedelta(hours=9))
PAGE = 1000
MIN_REGIONS = 200
KEEP_H = 3          # 예보가 그대로면 이 시간까지는 다시 저장하지 않음


def call(key, page):
    p = {"ServiceKey": urllib.parse.unquote(key), "pageNo": str(page), "numOfRows": str(PAGE),
         "_type": "json", "excludeForecast": "0"}
    url = API + "?" + urllib.parse.urlencode(p)
    last = None
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:      # 키는 오류 메시지에 남기지 않음
            last = type(e).__name__
            time.sleep(5 * (attempt + 1))
    raise RuntimeError(f"{page}쪽 받기 실패 ({last})")


def num(x):
    try:
        return int(math.floor(float(str(x).replace(",", "")) + 0.5))
    except Exception:
        return None


def items_of(j):
    body = (j.get("response") or {}).get("body") or {}
    items = body.get("items") or {}
    items = items.get("item", []) if isinstance(items, dict) else []
    if isinstance(items, dict):
        items = [items]
    return body, items


def main():
    key = os.environ.get("SERVICE_KEY", "").strip()
    if not key and len(sys.argv) > 1:
        key = open(sys.argv[1], encoding="utf-8").read().strip()
    if not key:
        sys.exit("SERVICE_KEY 가 없습니다.")

    # 자주 도는 예약 실행용: 저장된 자료가 이 시간(SKIP_IF_NEWER_H)보다 새것이면 API를 부르지 않고 끝냄
    fresh_h = float(os.environ.get("SKIP_IF_NEWER_H", "0") or 0)
    if fresh_h > 0:
        try:
            with open(OUT, encoding="utf-8") as f:
                cur = json.load(f)["updated"]
            age = datetime.datetime.now(KST) - datetime.datetime.strptime(cur, "%Y-%m-%d %H:%M").replace(tzinfo=KST)
            if age < datetime.timedelta(hours=fresh_h):
                print(f"자료가 아직 새것이라 건너뜀 (마지막 저장 {cur})")
                return
        except Exception:
            pass

    j = call(key, 1)
    head = (j.get("response") or {}).get("header") or {}
    if str(head.get("resultCode", "")) not in ("00", "0"):
        sys.exit(f"API 오류: {head.get('resultCode')} {head.get('resultMsg')}")
    body, items = items_of(j)
    total = int(body.get("totalCount") or 0)
    if total <= 0:
        sys.exit("전체 건수(totalCount)가 없습니다.")
    collected = list(items)
    per_page = max(len(items), 1)
    page = 1
    while len(collected) < total and page < math.ceil(total / per_page) + 2:
        page += 1
        _, items = items_of(call(key, page))
        if not items:
            break
        collected.extend(items)

    regions = {}
    for it in collected:
        code = str(it.get("sigucode") or "")
        t = str(it.get("analdate") or "")
        mx = num(it.get("maxi"))
        if not code or not t or mx is None:
            continue
        r = regions.setdefault(code, {"name": f'{it.get("doname", "")} {it.get("sigun", "")}'.strip(), "rows": {}})
        row = [t, mx, num(it.get("meanavg")), num(it.get("d1")), num(it.get("d2")), num(it.get("d3")), num(it.get("d4"))]
        if t not in r["rows"] or mx > r["rows"][t][1]:       # 같은 시각이 두 번 오면 높은 값을 남김
            r["rows"][t] = row
    for r in regions.values():
        r["rows"] = [r["rows"][t] for t in sorted(r["rows"])]

    if len(collected) < total or len(regions) < MIN_REGIONS:
        sys.exit(f"자료가 온전하지 않아 저장하지 않음: 행 {len(collected)}/{total}, 지역 {len(regions)}곳")

    out = {
        "updated": datetime.datetime.now(KST).strftime("%Y-%m-%d %H:%M"),
        "source": "산림청 국립산림과학원_산불위험예보정보 (공공데이터포털)",
        "cols": ["시각", "최댓값", "평균", "낮음%", "다소높음%", "높음%", "매우높음%"],
        "regions": dict(sorted(regions.items())),
    }
    # 예보 내용이 그대로고 마지막 저장이 3시간 안이면 저장하지 않음(1시간마다 돌아도 올리는 횟수는 줄임)
    try:
        with open(OUT, encoding="utf-8") as f:
            old = json.load(f)
        old_t = datetime.datetime.strptime(old["updated"], "%Y-%m-%d %H:%M").replace(tzinfo=KST)
        if old.get("regions") == out["regions"] and datetime.datetime.now(KST) - old_t < datetime.timedelta(hours=KEEP_H):
            print(f"예보 내용이 그대로라 저장하지 않음 (마지막 저장 {old['updated']})")
            return
    except Exception:
        pass
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    tmp = OUT + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, OUT)
    print(f"시군구 {len(regions)}곳, 행 {sum(len(r['rows']) for r in regions.values())}개 저장 (전체 {total})")


if __name__ == "__main__":
    main()
