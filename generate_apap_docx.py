# -*- coding: utf-8 -*-
"""Generate filled апап.docx from SECTIONS (no template required)."""
from __future__ import annotations

import sys
from pathlib import Path

try:
    from docx import Document
except ImportError:
    import subprocess

    subprocess.check_call([sys.executable, "-m", "pip", "install", "python-docx", "-q"])
    from docx import Document

# Import from sibling module
sys.path.insert(0, str(Path(__file__).resolve().parent))
from fill_apap import OUT, SECTIONS, build_document_from_sections


def main() -> int:
    doc = Document()
    build_document_from_sections(doc)
    doc.save(str(OUT))
    size = OUT.stat().st_size
    print(f"OK: {OUT} ({size} bytes)")
    return 0 if size > 10000 else 1


if __name__ == "__main__":
    raise SystemExit(main())
