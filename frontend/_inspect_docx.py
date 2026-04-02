from docx import Document
from pathlib import Path

root = Path(r"c:/Users/huuti/Downloads/WebNongSan")
for name in [
    "BM02_Bao_Cao_Retrospective.docx",
    "BM03_Ke_Hoach_Sprint_2.docx",
    "BM04_Theo_Doi_Cai_Tien.docx",
]:
    p = root / name
    doc = Document(p)
    print(f"\n=== {name} ===")
    for ti, t in enumerate(doc.tables):
        print(f"Table {ti} rows {len(t.rows)} cols {len(t.columns)}")
        for r, row in enumerate(t.rows):
            vals = []
            for c, cell in enumerate(row.cells):
                txt = " ".join(cell.text.replace("\n", " ").split())
                vals.append(f"[{c}] {txt}")
            print(f"  r{r}: " + " | ".join(vals))
