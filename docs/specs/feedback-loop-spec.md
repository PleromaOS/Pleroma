# Pleroma — Result Feedback & Training-Data Loop (draft v1, pending sign-off)

Applies to the Precision path only (the one on-demand generated image per
client). Generic path has no generated image, so no rating step.

## 1. Client-facing accuracy check

Immediately after the client sees their generated look:

> "Does this look like what you were picturing?"
> 100% / 80% / 60% / lower

No barber involved. No client "flagging" mechanic — just this one rating
question. Anything at 100% closes out, no further action.

## 2. Auto-escalation on anything under 100%

The generation, its rating, and the full client spec are automatically
queued for owner review. Nothing further happens client-side — they've
already given their answer and move on with their haircut as scheduled;
the review is purely internal and doesn't block or slow their visit.

## 3. Owner review workflow

You see, side by side: the original spec (style name + full barber spec)
and the generated image. A single notes field: what's wrong, in your own
words ("fade line too high," "missed the ear coverage," "hairline too
soft"). Saved against that generation's record.

## 4. The database (every generation, rated or not)

One row per generation:

| Field | Source |
|---|---|
| Internal ID/name | assigned automatically, never client-facing |
| Client spec (style name + full spec) | Precision flow |
| Prompt actually sent to the model | system |
| Generated image | system |
| Client accuracy rating | client |
| Owner review notes (if <100%) | you |
| Reviewed at / by | system |

This is the full historical log — the raw material everything else is
built from.

## 5. What "training the AI" realistically means here

Pleroma is not fine-tuning Higgsfield's underlying model — that's not
something exposed to API consumers. What the database above actually
enables, honestly:

- **A validated prompt-pattern library.** Specs that repeatedly score
  100% get their prompt phrasing saved as a reusable template for similar
  future specs — your own internal style guide for "prompts that work."
- **Reference-image conditioning** (needs confirming whether Higgsfield
  supports this) — passing a past 100%-rated image as a visual reference
  alongside the text prompt for a similar new spec, to pull results
  toward things already proven good.
- **Failure-pattern flags.** If a particular spec combination (e.g. curly
  + high fade) keeps scoring low, that's a signal to either fix the
  prompt template for that combination or be cautious about promising it
  client-facing until it's been fixed.

This is a v1 hypothesis. Whether Higgsfield exposes reference-image
conditioning or any other steering mechanism beyond prompt text still
needs to be confirmed before assuming it as a mechanism.

## Open items before build

- Confirm whether Higgsfield's API supports reference-image conditioning
  or only text prompts.
- Design the actual owner review screen (this doc describes the
  workflow, not the UI).
- Decide retention/volume expectations for the database as client volume
  grows.
