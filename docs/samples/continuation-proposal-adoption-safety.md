# Continuation Proposal Adoption Safety

> Role: compact evidence artifact for `NG-continuation-proposal-adoption-safety-001`. This is a safety/readiness note, not a human narrative review card and not real AI quality evidence.

## Purpose

The generated specimen path now validates a `StructuredContinuationProposal` before it is adopted into a playable model. The gate is intentionally bounded: it checks the proposal shape, target references, supported effects, safe ids, and direct-mutation boundaries without becoming a full policy engine or changing core transition semantics.

## Accepted

| Proposal part | Safety meaning | Current specimen state |
| --- | --- | --- |
| `nodeIdHint` | Non-empty safe id, no collision with existing model nodes | Accepted as `generated_specimen_continuation` |
| `text` | Non-empty generated node body | Accepted from deterministic adapter output |
| `followUpChoice.idHint` | Non-empty safe id | Accepted as `connect_generated_specimen_archive` |
| `followUpChoice.text` | Non-empty player-facing choice text | Accepted from deterministic adapter output |
| `followUpChoice.targetId` | Existing model node or explicitly builder-created node | Accepted because `archive` exists |
| `followUpChoice.effects` | Non-empty list of supported effect shapes | Accepted as `addResource evidence +2` |

## Rejected

| Rejection class | Reason |
| --- | --- |
| Empty generated text | Would create an adopted node with no reviewable body |
| Missing follow-up choice text | Would create an adopted node with no player-facing route out |
| Missing or unknown follow-up target | Would break route playability or hide a builder repair |
| Existing-node id collision | Would overwrite or obscure model graph ownership |
| Unsupported effect type | Would serialize semantics the engine cannot safely apply |
| Malformed resource or effect target fields | Would hide incomplete provider output behind builder assumptions |
| Direct model mutation keys such as `nodes` or `mutations` | Proposal output must not patch existing graph structures directly |

## Explicitly Adjusted

The gate can normalize safe provider id hints to the builder's configured specimen ids when those ids are non-colliding. That status is recorded as `validation_adjusted`, with each adjustment repeated in `proposal_validation.reasons` and `ownershipBoundary.validation_adjusted`.

The current deterministic specimen does not need adjustment; its validation status is `accepted`.

## Provider-Like Fixture Coverage

`docs/samples/provider-family-proposal-fixtures.md` records an offline fixture family that exercises provider-shaped outputs before real provider work. The family covers strict valid output, safe id normalization, hallucinated targets, generated node collisions, unsupported effects, empty generated text, missing follow-up choice text, direct mutation requests, malformed resource effects, and malformed effect targets.

The fixture tests assert that accepted cases are accepted, adjusted cases are explicitly `validation_adjusted`, rejected cases are rejected before adoption, and every non-accepted case carries a visible reason.

## Out Of Scope

- OpenAI provider work.
- Local LLM work.
- Narrative quality acceptance.
- CSV schema fields.
- Web Tester UI redesign.
- Core engine transition semantics.
- Broad SP-DTYARN redesign.

## Why This Matters Before Real Provider Work

Future providers can return the same `StructuredContinuationProposal` shape and be tested against the same adoption gate. That keeps provider output inspectable before model mutation, separates adapter-generated fields from builder-added scaffolding, and preserves the generated specimen's route-playability checks.
