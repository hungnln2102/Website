# -*- coding: utf-8 -*-
"""
Validate WEBSITE_PRODUCTION_READINESS_ASSESSMENT.md (UTF-8, key Vietnamese phrases).

The assessment is maintained directly in the .md file. Run:
  python docs/build_vi_assessment.py
from repo root my-store/, or from docs/ as: python build_vi_assessment.py
"""
from __future__ import annotations

from pathlib import Path


def main() -> None:
    here = Path(__file__).resolve().parent
    md = here / "WEBSITE_PRODUCTION_READINESS_ASSESSMENT.md"
    text = md.read_text(encoding="utf-8")

    # ASCII + \\u only in this file to avoid editor/tool encoding issues
    must = (
        "\u0110\u00e1nh gi\u00e1 t\u1ed5ng quan h\u1ec7 th\u1ed1ng",  # Dánh giá tổng quan hệ thống
        "go-live",
        "order_list",
        "variant_margin",
        "pricing_tier",
    )
    for fragment in must:
        assert fragment in text, f"missing fragment in {md.name}: {fragment!r}"

    assert "\ufffd" not in text, "replacement character U+FFFD found — file may be mojibake"
    print("OK:", md, "chars", len(text))


if __name__ == "__main__":
    main()
