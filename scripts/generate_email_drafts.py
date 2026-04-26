import json
import html
import re
import sys
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path

from openpyxl import load_workbook

PLACEHOLDER_RE = re.compile(r"\{\{([A-Z0-9_]+)\}\}")
PROGRESS_PREFIX = "__GREEKLIT_PROGRESS__"


def emit_progress(stage, message, current=0, total=0, percent=None, **metrics):
    payload = {
        "current": current,
        "message": message,
        "stage": stage,
        "total": total,
    }
    if percent is not None:
        payload["percent"] = max(0, min(100, int(percent)))
    for key, value in metrics.items():
        payload[key] = value
    print(f"{PROGRESS_PREFIX}{json.dumps(payload, ensure_ascii=True)}", flush=True)


def stage_percent(start, end, current, total):
    if total <= 0:
        return start
    return start + round(((end - start) * current) / total)


def normalize_cell_value(value):
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d")
    if isinstance(value, date):
        return value.strftime("%Y-%m-%d")
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, int):
        return str(value)
    if isinstance(value, float):
        if value.is_integer():
            return str(int(value))
        normalized = format(Decimal(str(value)).normalize(), "f")
        return normalized.rstrip("0").rstrip(".") if "." in normalized else normalized
    return str(value).strip()


def render_template(template_text, values):
    def replacer(match):
        token = match.group(1)
        replacement = values.get(token)
        return html.escape(replacement) if replacement is not None else match.group(0)

    return PLACEHOLDER_RE.sub(replacer, template_text)


def build_row_values(worksheet, row_number, mapping):
    values = {}
    for token, column in mapping.items():
        values[token] = normalize_cell_value(worksheet[f"{column}{row_number}"].value)
    return values


def write_email_drafts_html(path, drafts):
    sections = []

    for heading, rendered_html in drafts:
        sections.append(
            "\n".join(
                [
                    '<section style="margin-bottom: 28px;">',
                    f"<p><strong>{html.escape(heading)}</strong></p>",
                    rendered_html,
                    "</section>",
                ]
            )
        )

    document_html = "\n".join(
        [
            "<!DOCTYPE html>",
            '<html lang="en">',
            "<head>",
            '<meta charset="utf-8" />',
            "<title>Email Drafts</title>",
            "</head>",
            '<body style="font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.45;">',
            "\n".join(sections) if sections else "<p>No email drafts were generated.</p>",
            "</body>",
            "</html>",
        ]
    )

    path.write_text(document_html, encoding="utf-8")


def write_report(path, payload, placeholders, generated_rows, skipped_rows):
    lines = [
        "Email Draft Generation Report",
        "",
        f"Workbook: {payload['workbook_path']}",
        f"Worksheet: {payload['worksheet_name']}",
        f"Output directory: {payload['output_dir']}",
        "",
        f"Email placeholders: {', '.join(sorted(placeholders)) or '(none)'}",
        f"Generated rows: {len(generated_rows)}",
        f"Skipped rows: {len(skipped_rows)}",
        "",
        "Skipped rows:",
    ]

    if skipped_rows:
        for row_number, missing in skipped_rows:
            lines.append(f"- Row {row_number}: missing {', '.join(missing)}")
    else:
        lines.append("- None")

    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    payload = json.loads(sys.argv[1])
    emit_progress("prepare", "Loading workbook and email template.", percent=5)

    workbook = load_workbook(payload["workbook_path"], data_only=True)
    worksheet_name = payload["worksheet_name"]
    if worksheet_name not in workbook.sheetnames:
        raise ValueError(
            f"Worksheet {worksheet_name!r} not found. Available sheets: {', '.join(workbook.sheetnames)}"
        )

    worksheet = workbook[worksheet_name]
    data_start_row = int(payload["data_start_row"])
    template_text = payload["email_template_text"]
    mapping = payload["mapping"]
    output_dir = Path(payload["output_dir"])
    output_dir.mkdir(parents=True, exist_ok=True)

    placeholders = set(PLACEHOLDER_RE.findall(template_text))
    generated_rows = []
    skipped_rows = []
    drafts = []
    total_rows = max(0, worksheet.max_row - data_start_row + 1)
    emit_progress(
        "prepare",
        f"{total_rows} workbook rows found.",
        total=total_rows,
        percent=10,
        rowsFound=total_rows,
    )

    for row_index, row_number in enumerate(range(data_start_row, worksheet.max_row + 1), start=1):
        emit_progress(
            "email",
            f"Preparing email draft for row {row_number}.",
            current=row_index,
            total=total_rows,
            percent=stage_percent(15, 85, row_index, total_rows),
            emailDraftCount=len(generated_rows),
            generatedCount=len(generated_rows),
            rowsFound=total_rows,
            skippedCount=len(skipped_rows),
        )
        row_values = build_row_values(worksheet, row_number, mapping)
        missing = sorted(
            placeholder for placeholder in placeholders if not row_values.get(placeholder, "")
        )

        if missing:
            skipped_rows.append((row_number, missing))
            emit_progress(
                "email",
                f"Skipped workbook row {row_number}.",
                current=row_index,
                total=total_rows,
                percent=stage_percent(15, 85, row_index, total_rows),
                emailDraftCount=len(generated_rows),
                generatedCount=len(generated_rows),
                rowsFound=total_rows,
                skippedCount=len(skipped_rows),
            )
            continue

        rendered = render_template(template_text, row_values)
        application_code = row_values.get("APPLICATION_CODE", "")
        heading = (
            f"===== {application_code} - ROW {row_number} ====="
            if application_code
            else f"===== ROW {row_number} ====="
        )
        drafts.append((heading, rendered))
        generated_rows.append(row_number)
        emit_progress(
            "email",
            f"Prepared email draft for row {row_number}.",
            current=row_index,
            total=total_rows,
            percent=stage_percent(15, 85, row_index, total_rows),
            emailDraftCount=len(generated_rows),
            generatedCount=len(generated_rows),
            rowsFound=total_rows,
            skippedCount=len(skipped_rows),
        )

    combined_email_path = output_dir / "email_drafts.html"
    report_path = output_dir / "generation_report.txt"

    emit_progress(
        "report",
        "Writing email draft files and report.",
        percent=92,
        emailDraftCount=len(generated_rows),
        expectedEmailDraftCount=len(generated_rows),
        generatedCount=len(generated_rows),
        rowsFound=total_rows,
        skippedCount=len(skipped_rows),
    )
    write_email_drafts_html(combined_email_path, drafts)
    write_report(report_path, payload, placeholders, generated_rows, skipped_rows)

    print(f"Generated {len(generated_rows)} emails.")
    print(f"Skipped {len(skipped_rows)} rows.")
    print(f"Combined email drafts file: {combined_email_path}")
    print(f"Report: {report_path}")
    emit_progress(
        "complete",
        "Email draft generation complete.",
        percent=100,
        emailDraftCount=len(generated_rows),
        expectedEmailDraftCount=len(generated_rows),
        generatedCount=len(generated_rows),
        rowsFound=total_rows,
        skippedCount=len(skipped_rows),
    )


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        raise
