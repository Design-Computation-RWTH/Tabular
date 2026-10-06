# Tutorial: prepare data and understand the RO-Crate

## Outcome

You will prepare a predictable input table, decide whether its rows should
also become RDF, and understand the files produced by RO-Crate.

## 1. Make the table predictable

A reusable research table normally has:

- one observation, measurement, or record per row;
- one variable per column;
- one header row with unique, non-empty column names;
- consistent value types within a column; and
- documented units, codes, abbreviations, and missing-value conventions.

Avoid decorative title rows, merged cells, subtotals, and unrelated tables in
the data area. Preserve identifiers such as `00123` as text, use unambiguous
dates such as `2026-08-25`, and save CSV files as UTF-8 when possible.

Tabular accepts CSV, TSV, TXT, XLS, XLSX, XLSM, XLSB, ODS, and HTML tables. It
reads workbook values and does not execute Excel macros.

## 2. Choose the import options

After selecting the file:

- keep **First row contains headers** enabled for a normal header row;
- disable it to generate `Column 1`, `Column 2`, and similar names; or
- enable **Rotate rows into columns** when field names run down the first
  column.

Rotation stops at the first empty row or change in populated column count. For
a heavily formatted report, make a clean data copy in Excel or LibreOffice
instead of relying on rotation.

## 3. Decide whether to convert rows to RDF

Enable **Convert tabular data to RDF (CSVW)** when downstream users need an RDF
representation of every row and value. Tabular uses the W3C CSV on the Web
table-and-row model and includes the generated Turtle in connected RO-Crates.

Leave this option disabled when the CSV files are the intended data format and
only their metadata needs to be RDF. The conversion is optional because large
tables can produce substantially larger RDF metadata.

## 4. Connect the complete package

For a local export, connect:

- **Tabular file → RO-Crate** for the worksheets;
- **Column Descriptions → RO-Crate** for field metadata; and
- **Metadata Form → RO-Crate** for dataset metadata.

The preview and column-description nodes use the first worksheet. Every
worksheet is retained and exported as CSV under `original_data/`. Formulas,
formatting, macros, charts, and other workbook features are not preserved in
those CSV files.

## 5. Inspect the result

The RO-Crate node reports its RDF triple count and shows a Turtle preview.
Choose **Download Turtle** to inspect `metadata.ttl` separately, or
**Download RO-Crate** for the full ZIP.

The ZIP contains:

- `ro-crate-metadata.json`, the RO-Crate 1.3 JSON-LD catalogue;
- `metadata.ttl`, containing connected metadata and optional row RDF; and
- one CSV per worksheet under `original_data/`.

## Optional: configure the export

Add an `export_config` worksheet with `key` and `value` columns:

| key | value |
| --- | --- |
| dataset_id | drilling-run-07 |
| dataset_title | Drilling machine run 07 |
| dataset_description | Temperature and rotation measurements from run 07. |
| license | CC BY 4.0 |

Recognised keys are `dataset_id`, `dataset_name`, `dataset_title`,
`dataset_label`, `title`, `dataset_description`, `description`, and `license`.
The dataset identifier or name determines the ZIP filename. The
`export_config` worksheet is also included as a CSV.

---

[Documentation guide](README.md) · [Next: Deposit in Coscine](coscine.md)
