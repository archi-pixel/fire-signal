# -*- coding: utf-8 -*-
"""
산림청 국립산림과학원_산불위험예보정보(공공데이터포털 15084817)에서
전국 시군구 산불위험예보지수(현재 + 72시간 예보)를 받아 data/fire.json 으로 저장한다.
GitHub Actions 가 3시간마다 실행한다. 인증키는 저장소 비밀값 SERVICE_KEY 로만 받는다.
"""
import os, sys, json, time, datetime, urllib.request, urllib.parse

API = "https://apis.data.go.kr/1400377/forestPointV2/forestPointListSigunguSearchV2"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "fire.json")
KST = datetime.timezone(datetime.timedelta(hours=9))


def call(key, page):
    p = {"ServiceKey": urllib.parse.unquote(key), "pageNo": str(page), "numOfRows": "1000",
         "_type": "json", "excludeForecast": "0"}
    url = API + "?" + urllib.parse.urlencode(p)
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:
            if attempt == 2:
                raise
            time.sleep(5)


def num(x):
    try:
        return round(float(str(x).replace(",", "")))
    except Exception:
        return None


def main():
    key = os.environ.get("SERVICE_KEY", "").strip()
    if not key and len(sys.argv) > 1:
        key = open(sys.argv[1], encoding="utf-8").read().strip()
    if not key:
        sys.exit("SERVICE_KEY 가 없습니다.")
    regions, page, total = {}, 1, None
    while True:
        j = call(key, page)
        body = j["response"]["body"]
        total = int(body.get("totalCount") or 0)
        items = body.get("items") or {}
        items = items.get("item", []) if isinstance(items, dict) else []
        if isinstance(items, dict):
            items = [items]
        for it in items:
            code = str(it.get("sigucode") or "")
            t = str(it.get("analdate") or "")
            mx = num(it.get("maxi"))
            if not code or not t or mx is None:
                continue
            r = regions.setdefault(code, {"name": f'{it.get("doname", "")} {it.get("sigun", "")}'.strip(), "rows": []})
            r["rows"].append([t, mx, num(it.get("meanavg")), num(it.get("d1")), num(it.get("d2")),
                              num(it.get("d3")), num(it.get("d4"))])
        if page * 1000 >= total or not items:
            break
        page += 1
    for r in regions.values():
        r["rows"] = sorted({tuple(x) for x in r["rows"]})
        r["rows"] = [list(x) for x in r["rows"]]
    if not regions:
        sys.exit("받은 자료가 없습니다.")
    out = {
        "updated": datetime.datetime.now(KST).strftime("%Y-%m-%d %H:%M"),
        "source": "산림청 국립산림과학원_산불위험예보정보 (공공데이터포털)",
        "cols": ["시각", "최댓값", "평균", "낮음%", "다소높음%", "높음%", "매우높음%"],
        "regions": dict(sorted(regions.items())),
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    print(f"시군구 {len(regions)}곳, 행 {sum(len(r['rows']) for r in regions.values())}개 저장 (전체 {total})")


if __name__ == "__main__":
    main()
