# AI hair transfer — how it fits together

Client uploads a photo, gets back the same photo with the briefed haircut on it.
First working production render: **Sep 10, 2026**.

> **Updated 2026-09-26 (ADR 0014).** `hair-transfer` is now the kitchen, not a
> public endpoint: it refuses any caller without the service key, so only the
> doors in `functions/` can start a render. Every render now requires `shopId`
> and `consultationId`. The `renders` bucket is now **private**; images are
> served as signed links that expire after one hour. The live source is now in
> this repo (`functions/hair-transfer/`), and the prompt it builds was verified
> byte-identical to the 10 Sep test renders before deploying.

## Flow

```
quiz answers
  -> buildRenderRequest()      pure fn, no I/O — composes the prompt
  -> pick_style_reference()    Postgres fn — picks the reference photo
  -> hair-transfer edge fn     renders in background (30-60s)
  -> renders table + storage   client polls GET ?renderId=
```

## API

```
POST /functions/v1/hair-transfer
  { styleId, texture, sides, fadeHeight, beard, partingLine?,
    photoBase64 | photoPath, consultationId? }
  -> { renderId, status: "running", usedReference }

GET  /functions/v1/hair-transfer?renderId=<id>
  -> { renderId, status, outputUrl, usedReference, error }
```

`status` is one of queued | running | succeeded | failed.

## Required secrets

| Name | Notes |
|---|---|
| `GEMINI_API_KEY` | **exact name.** A secret named `gemini api` reads as empty and Google returns `API_KEY_INVALID` with no other clue. Billing must be enabled — Nano Banana Pro has no free tier. |
| `GEMINI_IMAGE_MODEL` | optional, defaults to `gemini-3-pro-image` |

## Buckets

- `client-photos` — **private.** The client's face is never on a public URL;
  the edge function downloads it server-side. Rows expire after 24h.
- `style-library` — public. Reference photos, flat filenames.
- `renders` — **private** (since 2026-09-26). Output images; a render is the client's face.

## THE THING TO NOT BREAK

Prompt order is load-bearing. **Preservation first, cut second, style name never
at the front.** If the style name leads, the model renders its stock idea of that
haircut — which is straight-haired — and quietly straightens a curly client.

And it needs **two images**. Words alone cannot hold hair texture; a reference
photo separates *shape* (image 2) from *hair* (image 1). This was measured
repeatedly, not assumed. See CONTEXT.md for the full comparison.

## Adding reference photos

1. Name it `<texture>_<fade>_<line>_<extra>.jpg`
   e.g. `curly_mid-skin-fade_with-line_dark.jpg`
2. Upload to the `style-library` bucket (flat, no folders).
3. Insert a row into `style_references` (style_id, storage_path, texture, sides,
   fade_height). Set `verified = true` only after LOOKING at the image — filenames
   have been wrong before and that is what broke matching the first time.

A wrong-texture reference is worse than none, so `pick_style_reference` returns
nothing rather than a mismatch, and the render degrades to text-only.

## Current gap

Zero curly references in the library. Curly is permitted on 14 of 21 styles and
is exactly the texture text-only rendering fails. Collect curly first.

## Getting the function source into this repo

The live source is in Supabase, not here. From a normal terminal:

```bash
supabase link --project-ref eusyxqguevqgrnnjqhut
supabase functions download hair-transfer
```

That writes `index.ts`, `build-request.ts` and `styles.ts` into
`supabase/functions/hair-transfer/`. Do this before editing anything, and commit
it, so the deployed version and the repo cannot drift apart.

`styles.ts` is generated from `data/quiz-data.json` — regenerate it rather than
hand-editing, or the quiz and the renderer will disagree about what a style is.

## Dev-only functions to delete before launch

`gemini-test` and `dev-seed` were built to test this from an environment that
could not reach Google directly. Both run with `verify_jwt: false`. Remove them:

```bash
supabase functions delete gemini-test
supabase functions delete dev-seed
```
