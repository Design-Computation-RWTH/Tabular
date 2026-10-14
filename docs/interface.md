# Use the visual workflow

## Outcome

You will be able to add nodes, identify compatible connections, and read the
flow.

## Add and connect nodes

Drag a node button from the sidebar onto the canvas. Each node has:

- an input handle on the left;
- an output handle on the right; and
- an `i` button for task-specific help.

Hover over an input handle to see which upstream node types it accepts. Drag
from a source's output to a compatible input to connect them. Nodes with no
supported incoming connections do not display an input handle. Output handles
similarly list compatible downstream nodes and are hidden when no node
connection is supported.

Dragging a terminology concept or unit into a Column Descriptions field is a
value copy, not a node connection. Connecting **Terminology Service** or
**Units** to a Column Descriptions node additionally enables type-to-search
suggestions in its description and unit fields.

Connection labels explain what moves through the workflow, such as **file**,
**column description**, **unit**, or **metadata**. Animated blue lines are
active data paths. A red dashed metadata-profile line is inactive because a
connected Coscine resource currently controls that form.

## Follow the next-steps checklist

The checklist at the top of the canvas tracks the whole workflow: load a file,
describe the columns, complete the metadata form, prepare the RO-Crate, and
deposit it in Coscine when a Coscine node is present. The first unfinished step
is highlighted as the current action, and each step shows its progress, such as
**3 of 7 columns described**.

Choose a step to move the canvas to the node it refers to. Choosing an
unfinished step also marks it as done, for example when a step does not apply
to your task; choose it again to clear the mark. Steps complete on their own
once the workflow satisfies them. The checklist never changes the workflow
data; it only tracks progress.

## Arrange and inspect the canvas

- The starting workflow and each selected workflow are centered and fit into the canvas.
- Drag a node to move it.
- Drag empty canvas space to pan.
- Scroll or use the lower-left controls to zoom.
- Select a node or connection and press <kbd>Delete</kbd> or
  <kbd>Backspace</kbd> to remove it.
- Use the upper-right language buttons for English or German interface and
  vocabulary labels.

Some connections are protected while required by the workflow. In particular,
Coscine's profile and direct metadata connections cannot be removed while it
remains connected to an RO-Crate. Tabular explains how to unlock them if
removal is attempted.

## Design a workflow for the task

Begin with the smallest path that produces the intended result, then add
services only where they help:

- preview when the source needs inspection;
- terminology and QUDT when fields need semantic detail;
- Metadata Profile Search when a particular application profile is useful;
- Coscine when preparing a repository deposit; and
- optional CSVW row conversion when RDF data is required.

---

[Documentation guide](README.md) · [Quick start](../README.md)
