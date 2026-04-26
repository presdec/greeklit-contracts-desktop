"""
Tests for generate_contracts.py pure functions.

Strategy: fewest tests for most coverage. Tests focus on pure, file-free
functions plus a minimal load_mapping / load_config round-trip using temp files.
"""
import json
import sys
import tempfile
from datetime import date, datetime
from pathlib import Path

import pytest

SCRIPTS_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(SCRIPTS_DIR))

import generate_contracts as gc  # noqa: E402

WORKBOOK = SCRIPTS_DIR.parent / "templates" / "starter-workbook.xlsx"
DOCX = SCRIPTS_DIR.parent / "templates" / "starter-contract-template.docx"
EMAIL_TEMPLATE = SCRIPTS_DIR.parent / "templates" / "starter-email-template.txt"


# ---------------------------------------------------------------------------
# load_mapping
# ---------------------------------------------------------------------------

def _write_mapping(tmp_path: Path, content: str) -> Path:
    p = tmp_path / "field_mapping.txt"
    p.write_text(content, encoding="utf-8")
    return p


def test_load_mapping_valid(tmp_path):
    p = _write_mapping(tmp_path, "TITLE=C\n# comment\nAUTHOR=D\n")
    mapping = gc.load_mapping(p)
    assert mapping == {"TITLE": "C", "AUTHOR": "D"}


def test_load_mapping_empty_raises(tmp_path):
    p = _write_mapping(tmp_path, "# only comments\n")
    with pytest.raises(ValueError, match="empty"):
        gc.load_mapping(p)


def test_load_mapping_bad_line_raises(tmp_path):
    p = _write_mapping(tmp_path, "TITLE C\n")  # missing '='
    with pytest.raises(ValueError):
        gc.load_mapping(p)


def test_load_mapping_bad_column_raises(tmp_path):
    p = _write_mapping(tmp_path, "TITLE=c3\n")  # lowercase + digit
    with pytest.raises(ValueError):
        gc.load_mapping(p)


# ---------------------------------------------------------------------------
# load_config
# ---------------------------------------------------------------------------

def test_load_config_minimal(tmp_path):
    mapping_file = tmp_path / "field_mapping.txt"
    mapping_file.write_text("TITLE=C\n", encoding="utf-8")

    cfg_data = {
        "workbook_path": str(WORKBOOK),
        "worksheet_name": "8TH PERIOD",
        "contract_template_path": str(DOCX),
        "email_template_path": str(EMAIL_TEMPLATE),
        "mapping_path": str(mapping_file),
        "output_dir": str(tmp_path / "output"),
        "filename_pattern": "{{TITLE}}_contract",
    }
    cfg_file = tmp_path / "generator_config.json"
    cfg_file.write_text(json.dumps(cfg_data), encoding="utf-8")

    config = gc.load_config(cfg_file)

    assert config.worksheet_name == "8TH PERIOD"
    assert config.header_row == 1       # default
    assert config.data_start_row == 2   # default
    assert config.email_output_mode == "combined_docx"
    assert config.convert_to_pdf is True
    assert config.workbook_path == WORKBOOK


# ---------------------------------------------------------------------------
# extract_text_placeholders
# ---------------------------------------------------------------------------

def test_extract_text_placeholders():
    result = gc.extract_text_placeholders("Hello {{NAME}}, your ref is {{CODE}}.")
    assert result == {"NAME", "CODE"}


def test_extract_text_placeholders_empty():
    assert gc.extract_text_placeholders("no placeholders here") == set()


# ---------------------------------------------------------------------------
# collect_used_placeholders
# ---------------------------------------------------------------------------

def test_collect_used_placeholders_merges_all_sets():
    result = gc.collect_used_placeholders({"A", "B"}, {"B", "C"}, {"D"})
    assert result == {"A", "B", "C", "D"}


# ---------------------------------------------------------------------------
# normalize_cell_value
# ---------------------------------------------------------------------------

DATE_FMT = "%Y-%m-%d"

@pytest.mark.parametrize("value,expected", [
    (None, ""),
    ("  hello  ", "hello"),
    (42, "42"),
    (3.14, "3.14"),
    (3.0, "3"),
    (True, "TRUE"),
    (False, "FALSE"),
    (date(2025, 1, 15), "2025-01-15"),
    (datetime(2025, 6, 1, 12, 0), "2025-06-01"),
])
def test_normalize_cell_value(value, expected):
    assert gc.normalize_cell_value(value, DATE_FMT) == expected


# ---------------------------------------------------------------------------
# sanitize_filename
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("value,expected", [
    ("normal name", "normal name"),
    ("file<name>", "file-name-"),
    ('path/to/file', "path-to-file"),
    ("  .dotfile.  ", "dotfile"),
    ("", "contract"),
])
def test_sanitize_filename(value, expected):
    assert gc.sanitize_filename(value) == expected


# ---------------------------------------------------------------------------
# render_plain_text / render_html_template
# ---------------------------------------------------------------------------

def test_render_plain_text_replaces_known_fills_unknowns():
    result = gc.render_plain_text("Dear {{NAME}}, ref {{CODE}} and {{MISSING}}.", {"NAME": "Alice", "CODE": "GL-001"})
    assert result == "Dear Alice, ref GL-001 and {{MISSING}}."


def test_render_html_template_escapes_html():
    result = gc.render_html_template("Hello {{NAME}}", {"NAME": "<b>World</b>"})
    assert "&lt;b&gt;" in result
    assert "<b>" not in result


# ---------------------------------------------------------------------------
# extract_docx_parts_and_placeholders — real DOCX
# ---------------------------------------------------------------------------

def test_extract_docx_parts_and_placeholders():
    _, placeholders, _ = gc.extract_docx_parts_and_placeholders(DOCX)
    for token in ("TITLE", "AUTHOR", "AMOUNT"):
        assert token in placeholders


# ---------------------------------------------------------------------------
# replace_placeholders_in_docx — smoke test
# ---------------------------------------------------------------------------

def test_replace_placeholders_in_docx_produces_file(tmp_path):
    out = tmp_path / "out.docx"
    gc.replace_placeholders_in_docx(DOCX, out, {
        "TITLE": "Test Book",
        "AUTHOR": "Test Author",
        "AMOUNT": "1000",
        "FIRST_INSTALLMENT": "500",
        "APPLICATION_CODE": "GL-TEST",
        "PUBLISHER": "Test Pub",
        "EMAIL_TO": "test@example.com",
        "EMAIL_CC": "",
        "LANGUAGE": "English",
        "ID": "1",
    })
    assert out.exists()
    assert out.stat().st_size > 0
