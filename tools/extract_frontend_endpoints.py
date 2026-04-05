import csv
import re
import sys
from pathlib import Path

root = Path(r"C:\DATA\Elite Clinic")
files = []
for base, pattern in [
    (root / "Frontend" / "actions", "*.ts"),
    (root / "Frontend" / "app", "*.tsx"),
    (root / "Frontend" / "lib", "*.ts"),
]:
    if base.exists():
        files.extend(sorted(base.rglob(pattern)))

string_re = re.compile(r"'(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\"|`(?:\\.|[^`\\])*`", re.DOTALL)
rows = []

for file_path in files:
    try:
        text = file_path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        continue

    rel = file_path.relative_to(root).as_posix()
    for match in string_re.finditer(text):
        literal = match.group(0)[1:-1]
        if "/api/" in literal:
            line = text.count("\n", 0, match.start()) + 1
            rows.append((rel, line, literal))

out_path = root / "docs" / "spec-kit" / "ENDPOINT_MATRIX_FRONTEND_USED.csv"
out_path.parent.mkdir(parents=True, exist_ok=True)

with out_path.open("w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["File", "Line", "RouteLiteral"])
    writer.writerows(rows)

unique_count = len({r[2] for r in rows})

print(f"CSV_PATH:{out_path.as_posix()}")
print(f"TOTAL_MATCHES:{len(rows)}")
print(f"UNIQUE_ROUTE_LITERAL_COUNT:{unique_count}")
print("FIRST_30_ROWS:")
writer = csv.writer(sys.stdout)
writer.writerow(["File", "Line", "RouteLiteral"])
for row in rows[:30]:
    writer.writerow(row)
