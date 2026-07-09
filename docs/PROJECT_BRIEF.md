# Project Brief

## Project name

NarrativeGen

## Purpose

Interactive narrative engine for node-and-choice stories. JSON is the primary full-fidelity model, TypeScript is the runtime source of truth, Web Tester is the review/edit/play surface, and the Unity SDK follows engine parity.

## Primary users

- Solo writer/designer/operator working through one-person role switches.
- Technical designer integrating structured narrative models into runtime surfaces.
- Future Unity integrator consuming the UPM package.

## User language

Japanese is the primary collaboration and review language. Code, schemas, and CLI output stay in their native language.

## Core value

Keep story-making and playback playable first, then use validation, schema checks, and tests as guards around that playable path.

## Product surface

- `packages/engine-ts/`: TypeScript story engine.
- `apps/web-tester/`: Vite Web Tester UI, model editing, graph/debug surfaces, play preview, import/export, Playwright E2E.
- `models/`: canonical JSON examples, schemas, and spreadsheet authoring samples.
- `packages/sdk-unity/`: Unity C# SDK in UPM package form.
- `packages/backend/`: Express REST API.

## Non-goals

- Do not let AI write the story; AI support is for production-system shaping unless a later gate changes that.
- Do not implement WritingPage integration while `docs/specs/writingpage-io-contract.md` remains No-Go.
- Do not promote or delete local Unity root-project residue without a separate Unity-scoped decision.

## Current product hypothesis

NarrativeGen should distinguish itself through structured narrative primitives: Dynamic Text, Entity-Property, Event, ConversationTemplate, Character Knowledge, and Perception Policy. The current reviewable proof is the playable vertical slice plus `originality-spine-probe.json`.

## Re-kickstart rule

This project prioritizes material evidence over report volume. BUILD turns must produce implementation, validation, screenshot, generated artifact, or reproducible probe evidence.
