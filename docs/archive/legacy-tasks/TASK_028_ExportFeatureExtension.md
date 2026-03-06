# Task: Export Feature Extension

## Background
The current export functionality only supports JSON and CSV. Users have requested support for other narrative formats like Twine and Ink to facilitate interoperability.

## Objective
Implement export functionality for Twine (Harlowe or Sugarcube compatible HTML/JSON) and Ink formats.

## Scope
-   **Twine Export**: Convert the current node graph into a Twine-compatible format (Twee or HTML).
-   **Ink Export**: Convert the current node graph into Ink format (.ink).
-   **UI Update**: Add options to the Export menu/modal.

## Requirements
1.  **Format Compliance**: The exported files should be valid and readable by Twine/Inky.
2.  **Data Preservation**: Text, choices, and basic logic (flags) should be preserved where possible.
    -   *Note*: Complex scripts might not map 1:1. Map what is possible and comment/warn about the rest.
3.  **Non-Destructive**: This addition must not affect existing JSON/CSV export.

## Definition of Done
-   "Export as Twine" option added to UI.
-   "Export as Ink" option added to UI.
-   Exported Twine file opens in Twine editor.
-   Exported Ink file compiles/runs in Inky or Ink player.
-   Unit tests for conversion logic.
