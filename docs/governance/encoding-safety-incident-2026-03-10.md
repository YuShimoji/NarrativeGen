# Encoding Safety Incident 2026-03-10

## Summary

Several documentation and UI files accumulated mojibake-like text after maintenance edits. The main risk was silent corruption in Source of Truth and operational docs, not an immediate runtime crash.

## Observed Symptoms

- `docs/spec-index.json` became invalid JSON and stopped acting as a reliable SoT.
- `docs/plans/DEVELOPMENT_PLAN.md` and parts of `apps/web-tester/src/ui/mermaid-preview.js` contained garbled text.
- Safety checks had no focused mode for changed files, so risky edits were easy to miss during iteration.

## Likely Trigger Path

1. PowerShell inline replacement or multiline string handling introduced unsafe text transformations.
2. Corrupted text was then saved back as UTF-8, preserving mojibake as valid bytes.
3. Follow-up edits reused already-corrupted files, spreading the issue into comments and docs.

## Reproduction Hints

- Editing JSON or Markdown through ad-hoc shell replacement is the highest-risk path.
- Literal backtick escapes such as `` `n `` or `` `r `` inside config-like files are a warning sign.
- Mixed cleanup steps across CRLF/LF boundaries make the result harder to review and can hide corruption in large diffs.

## Safe Recovery Rules

- Prefer targeted file edits over bulk text replacement.
- Validate `docs/spec-index.json` immediately after any spec maintenance.
- Run `npm run check:safety:changed` while iterating and `npm run check:safety` before merge.
- If a file already contains mojibake, normalize comments and doc text before layering new behavior changes on top.

## Prevention

- Keep `.gitattributes` enforcing text normalization.
- Avoid using shell one-liners for large-scale content replacement in docs or JSON.
- When a file shows suspicious glyph patterns, stop and inspect before continuing feature work.