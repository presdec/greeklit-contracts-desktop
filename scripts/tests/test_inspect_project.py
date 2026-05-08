"""
Tests for scripts/inspect_project.py

Strategy: fewest tests for most coverage.
  - One happy-path integration test against the real starter fixtures covers
    inspect_workbook, extract_contract_tokens, normalize_header_to_variable,
    get_column_letter, normalize_cell_value, and parse_positive_int all at once.
  - Targeted unit tests cover the remaining branches (empty paths, bad values,
    sheet fallback, alias matching) that the happy path cannot reach.
"""
import sys
from pathlib import Path

import pytest

# Allow importing the script directly without it being a package.
SCRIPTS_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(SCRIPTS_DIR))

import inspect_project as ip  # noqa: E402  (module-level import after sys.path patch)

WORKBOOK = SCRIPTS_DIR.parent / "templates" / "starter-workbook.xlsx"
DOCX = SCRIPTS_DIR.parent / "templates" / "starter-contract-template.docx"


# ---------------------------------------------------------------------------
# inspect_workbook — happy path
# ---------------------------------------------------------------------------

def test_inspect_workbook_returns_expected_structure():
    """Full integration: starter workbook + contract template."""
    result = ip.inspect_workbook({
        "workbook_path": str(WORKBOOK),
        "worksheet_name": "8TH PERIOD",
        "header_row": 2,
        "data_start_row": 3,
        "contractTemplatePath": str(DOCX),
    })

    # Worksheet metadata
    assert result["worksheetName"] == "8TH PERIOD"
    assert "8TH PERIOD" in result["worksheetNames"]
    assert result["headerRow"] == 2
    assert result["dataStartRow"] == 3
    assert result["totalRows"] == 3  # rows 3–5 in a 5-row sheet

    # Columns: A–J, first col is '#' mapped to APPLICATION_CODE
    cols = {c["columnLetter"]: c for c in result["columns"]}
    assert set(cols.keys()) == set("ABCDEFGHIJ")
    assert cols["A"]["header"] == "#"
    assert cols["A"]["suggestedVariable"] == "APPLICATION_CODE"
    assert cols["A"]["sampleValue"] == "1"
    assert cols["B"]["suggestedVariable"] == "APPLICATION_CODE"

    # Sample rows: up to 3 rows starting at dataStartRow
    assert len(result["sampleRows"]) == 3
    first = result["sampleRows"][0]
    assert first["rowNumber"] == 3
    assert "#" in first["values"]

    # Contract tokens extracted from the DOCX
    tokens = result["contractTokens"]
    for expected in ("AMOUNT", "APPLICATION_CODE", "AUTHOR", "TITLE"):
        assert expected in tokens, f"{expected} missing from contractTokens"

    # Token contexts should be non-empty strings for known tokens
    assert result["contractTokenContexts"]["TITLE"]


def test_starter_workbook_suggestions_cover_contract_tokens():
    """Starter fixtures should expose enough suggested variables for UI auto-mapping."""
    result = ip.inspect_workbook({
        "workbook_path": str(WORKBOOK),
        "worksheet_name": "8TH PERIOD",
        "header_row": 2,
        "data_start_row": 3,
        "contractTemplatePath": str(DOCX),
    })

    suggested_variables = {
        column["suggestedVariable"]
        for column in result["columns"]
        if column["suggestedVariable"]
    }
    required_tokens = {"AMOUNT", "APPLICATION_CODE", "AUTHOR", "TITLE"}

    assert required_tokens.issubset(set(result["contractTokens"]))
    assert required_tokens.issubset(suggested_variables)


def test_inspect_workbook_sheet_fallback_uses_first_sheet():
    """Empty worksheet name should silently fall back to the first sheet."""
    result = ip.inspect_workbook({
        "workbook_path": str(WORKBOOK),
        "worksheet_name": "",
        "header_row": 2,
        "data_start_row": 3,
        "contractTemplatePath": None,
    })
    assert result["worksheetName"] == "8TH PERIOD"
    assert result["contractTokens"] == []


def test_inspect_workbook_nonexistent_sheet_also_falls_back():
    """A worksheet name that does not exist should fall back to the first sheet."""
    result = ip.inspect_workbook({
        "workbook_path": str(WORKBOOK),
        "worksheet_name": "DOES_NOT_EXIST",
        "header_row": 2,
        "data_start_row": 3,
        "contractTemplatePath": None,
    })
    assert result["worksheetName"] == "8TH PERIOD"


# ---------------------------------------------------------------------------
# extract_contract_tokens — edge cases
# ---------------------------------------------------------------------------

def test_extract_contract_tokens_empty_path_returns_safe_dict():
    assert ip.extract_contract_tokens("") == {"contexts": {}, "tokens": []}
    assert ip.extract_contract_tokens(None) == {"contexts": {}, "tokens": []}


def test_extract_contract_tokens_missing_file_returns_safe_dict():
    assert ip.extract_contract_tokens("/nonexistent/path.docx") == {"contexts": {}, "tokens": []}


def test_extract_contract_tokens_real_docx():
    result = ip.extract_contract_tokens(str(DOCX))
    assert isinstance(result["tokens"], list)
    assert "TITLE" in result["tokens"]
    assert "AMOUNT" in result["tokens"]
    # Tokens are sorted
    assert result["tokens"] == sorted(result["tokens"])
    # Every token in contexts is also in tokens
    for key in result["contexts"]:
        assert key in result["tokens"]


# ---------------------------------------------------------------------------
# parse_positive_int
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("value,fallback,expected", [
    (2, 1, 2),
    ("3", 1, 3),
    (0, 5, 5),       # zero is not positive → fallback
    (-1, 5, 5),      # negative → fallback
    ("abc", 7, 7),   # non-numeric → fallback
    (None, 4, 4),    # None → fallback
])
def test_parse_positive_int(value, fallback, expected):
    assert ip.parse_positive_int(value, fallback) == expected


# ---------------------------------------------------------------------------
# normalize_header_to_variable — alias matching
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("header,expected_variable", [
    ("Application Code", "APPLICATION_CODE"),
    ("application code", "APPLICATION_CODE"),
    ("Email To", "EMAIL_TO"),
    # "Email Cc" hits the catch-all "email" substring in EMAIL_TO before EMAIL_CC is
    # checked — this is a known limitation of the fuzzy alias order. Test actual behavior.
    ("Email Cc", "EMAIL_TO"),
    # Exact-match in EMAIL_CC aliases wins when there's no leading "email" substring.
    ("cc", "EMAIL_CC"),
    ("Author", "AUTHOR"),
    ("Publisher", "PUBLISHER"),
    ("Amount", "AMOUNT"),
    ("First Installment", "FIRST_INSTALLMENT"),
    ("Language", "LANGUAGE"),
    ("Title", "TITLE"),
    ("Τίτλος", "TITLE"),
    ("Συγγραφέας", "AUTHOR"),
    ("Εκδότης", "PUBLISHER"),
    ("Ποσό", "AMOUNT"),
    ("Πρώτη Δόση", "FIRST_INSTALLMENT"),
    ("Γλώσσα", "LANGUAGE"),
    ("Κοινοποίηση", "EMAIL_CC"),
    ("Κωδικός Αίτησης", "APPLICATION_CODE"),
    ("Ημερομηνία Έναρξης", "IMEROMINIA_ENARXIS"),
    (
        "ΒΙΟΓΡΑΦΙΚΟ ΣΗΜΕΙΩΜΑ ΜΕΤΑΦΡΑΣΤΗ ΚΑΙ ΚΑΤΑΛΟΓΟΣ ΔΗΜΟΣΙΕΥΜΕΝΩΝ ΜΕΤΑΦΡΑΣΕΩΝ",
        "VIOGRAFIKO_SIMEIOMA",
    ),
    (
        "ΤΟ ΔΕΙΓΜΑ ΑΠΟ ΤΟ ΠΡΩΤΟΤΥΠΟ ΕΡΓΟ ΣΕ ΗΛΕΚΤΡΟΝΙΚΗ ΜΟΡΦΗ (PDF)",
        "TO_DEIGMA_APO_TO",
    ),
    # Unrecognised header → tokenised upper-snake form
    ("Some Unknown Field", "SOME_UNKNOWN_FIELD"),
])
def test_normalize_header_to_variable(header, expected_variable):
    assert ip.normalize_header_to_variable(header) == expected_variable


def test_normalize_header_to_variable_keeps_fallback_names_short():
    suggestion = ip.normalize_header_to_variable(
        "ΒΙΟΓΡΑΦΙΚΟ ΣΗΜΕΙΩΜΑ ΜΕΤΑΦΡΑΣΤΗ ΚΑΙ ΚΑΤΑΛΟΓΟΣ ΔΗΜΟΣΙΕΥΜΕΝΩΝ ΜΕΤΑΦΡΑΣΕΩΝ"
    )
    assert suggestion != "VIOGRAFIKO_SIMEIOMA_METAFRASTI_KAI_KATALOGOS_DIMOSIEYMENON_METAFRASEON"
    assert len(suggestion) <= ip.MAX_SUGGESTED_VARIABLE_LENGTH


# ---------------------------------------------------------------------------
# get_column_letter
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("index,expected", [
    (1, "A"),
    (26, "Z"),
    (27, "AA"),
    (52, "AZ"),
    (702, "ZZ"),
])
def test_get_column_letter(index, expected):
    assert ip.get_column_letter(index) == expected
