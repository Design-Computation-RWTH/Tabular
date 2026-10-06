# Tutorial: describe columns semantically

## Outcome

You will turn an ambiguous header such as `temp` into a column description
with a human-readable explanation, a reusable semantic concept, and a
machine-readable unit.

## Before you begin

Load a table and connect **Tabular file → Column Descriptions**. Confirm that
the expected headers appear.

## 1. Write a useful description

Describe what the value represents in this dataset. Prefer:

> Ambient air temperature measured at the inlet sensor.

over:

> Temperature column.

The first version gives a future reader context that is not present in the
header.

## 2. Add a terminology concept

1. Add **Terminology Service** to the canvas.
2. Search for the scientific concept represented by the field.
3. Review the result's label, definition, source ontology, and persistent IRI.
4. Drag the best result into the column's description field.

Tabular displays the readable label and retains the IRI. Hover over the linked
value to inspect it. Choose a concept because its definition matches the data,
not merely because its label resembles the header.

## 3. Select a quantity and unit

1. Connect **Quantity Kinds → Units**.
2. Search Quantity Kinds for `temperature` or another measured property.
3. Select the intended quantity kind.
4. Drag the correct result from **Units** into the column's Unit field.

This copies the selected unit into that field; it does not connect the Units
node to Column Descriptions. The node connection is only
**Quantity Kinds → Units**, which controls the unit filter.

The QUDT URI distinguishes units that may have similar names or symbols. Do not
add units to identifiers, categories, free text, or genuinely unitless values.

## 4. Check the result

Connect **Column Descriptions → RO-Crate**. Its Turtle preview should contain
the described column and, where selected, the concept and unit identifiers.
Column descriptions are updated automatically; they have no separate Save
button.

## How Tabular represents columns

Tabular uses established vocabularies rather than a private column ontology:

- **W3C CSVW** represents columns, names, and semantic property mappings;
- **Dublin Core Terms** represents textual descriptions; and
- **QUDT** represents the relationship to a controlled unit resource.

This RDF is complementary to the dataset metadata saved from Metadata Form.
For the broader distinction, read [Why Tabular](why-tabular.md).

---

[Documentation guide](README.md) · [Next: Data and RO-Crate](data-and-ro-crate.md)
