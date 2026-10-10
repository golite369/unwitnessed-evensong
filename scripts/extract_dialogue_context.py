import sys
from docx import Document


path = sys.argv[1]
paragraphs = [p.text.strip() for p in Document(path).paragraphs]

if len(sys.argv) == 4:
    start = max(0, int(sys.argv[2]))
    end = min(len(paragraphs), int(sys.argv[3]))
    for i in range(start, end):
        if paragraphs[i]:
            print(f"{i:04d} {paragraphs[i]}")
    raise SystemExit(0)

targets = [
    "礼拜堂提前开始了",
    "别紧张，中尉",
    "钟声里有东西",
    "你比我预计得早了两分钟",
    "第七次钟声后",
    "我不是赫尔曼",
    "地图……是我",
]

seen = set()
for index, paragraph in enumerate(paragraphs):
    if not any(target in paragraph for target in targets):
        continue
    start = max(0, index - 12)
    end = min(len(paragraphs), index + 18)
    key = (start, end)
    if key in seen:
        continue
    seen.add(key)
    print("\n" + "=" * 24 + f" 段落 {start}-{end} " + "=" * 24)
    for i in range(start, end):
        if paragraphs[i]:
            print(f"{i:04d} {paragraphs[i]}")

print("\n" + "=" * 24 + " 角色对白抽样 " + "=" * 24)
for name in ["伊蕾娜", "索菲", "埃文", "赫尔曼"]:
    lines = [p for p in paragraphs if p.startswith(name + "：")]
    print(f"\n[{name}] 共 {len(lines)} 条")
    for line in lines[:20]:
        print(line)
