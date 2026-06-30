# Provider Family Proposal Fixtures

> Role: offline safety fixture evidence for `NG-provider-family-proposal-fixtures-001`. These are provider-like proposal shapes, not real OpenAI/local LLM output and not narrative quality acceptance.

## Purpose

Before adding a real provider adapter, the same `validateContinuationProposalAdoption()` gate now has a compact family of provider-like proposal fixtures. The goal is to classify representative output shapes as `accepted`, `validation_adjusted`, or `rejected` before any proposal can mutate the playable graph.

## Fixture Family

| fixture family | proposal shape | expected gate result | reason example |
| --- | --- | --- | --- |
| `well_formed_provider_output` | Safe ids, non-empty node text, existing `archive` target, supported `addResource evidence +2` | `accepted` | `proposal passed bounded adoption validation` |
| `provider_ids_need_builder_normalization` | Safe provider ids that differ from configured specimen ids | `validation_adjusted` | `nodeIdHint adjusted from 'provider_node_742' to 'generated_specimen_continuation'` |
| `hallucinated_target` | Follow-up target points to a missing node | `rejected` | target does not exist in the model or builder-created nodes |
| `colliding_generated_node` | Generated node id already exists in the model | `rejected` | node id collides with an existing model node |
| `unsupported_effect_semantics` | Follow-up effect uses unsupported `teleport` type | `rejected` | effect type is not supported |
| `empty_generation_body` | Generated node text is blank | `rejected` | text must be non-empty |
| `missing_player_choice_copy` | Follow-up choice text is blank | `rejected` | follow-up choice text must be non-empty |
| `provider_attempts_graph_patch` | Proposal carries direct mutation data such as `mutations` | `rejected` | proposal must not carry direct model mutation keys |
| `malformed_resource_effect` | `addResource` effect has a blank key | `rejected` | effect key must be non-empty |
| `malformed_effect_target` | `goto` effect has a blank target | `rejected` | effect target must be a non-empty safe id |

## What This Protects

- Provider output cannot silently overwrite an existing node.
- Hallucinated targets are stopped before adoption.
- Unsupported effect semantics do not enter generated specimen artifacts.
- Empty generated text or player-facing choice copy is rejected.
- Direct graph patch requests stay outside the proposal contract.
- Safe id normalization remains visible as `validation_adjusted`, not hidden builder repair.

## What It Does Not Prove

- It does not call external APIs.
- It does not prove OpenAI, local LLM, or any future provider quality.
- It does not evaluate prose quality.
- It does not expand the CSV schema, Web Tester UI, core transition semantics, or SP-DTYARN export rules.

## Runnable Evidence

The fixture family is implemented in `packages/engine-ts/test/provider-family-proposal-fixtures.spec.ts`. It runs offline through `npm run test -w @narrativegen/engine-ts` and asserts that every rejected fixture has at least one visible reason and no invalid fixture is silently accepted.
