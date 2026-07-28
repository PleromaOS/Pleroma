# Pleroma — Higgsfield Mannequin Generation: Status & Plan

Living doc. Edit this file directly as work progresses — do not create a new
version each time something changes.

## Goal

Generate a full set of base mannequin head images (bald, neutral, studio
background) for each skin tone (Light / Medium / Deep), across multiple
camera angles (front, left profile, right profile, back). These become the
reference images used for haircut overlay generation and the consultation flow.

Eventually: replace still images with a full 3D scan of each mannequin.

## The matrix (revised)

**3 base mannequins** = 3 skin tones only. Hair texture is NOT baked into the
base — it is specified in the overlay prompt at generation time.

- Skin tone: Light (BC-light), Medium (BC-medium), Deep (BC-deep)
- Face shape: not included (future personalized route)
- Hair texture: handled via overlay prompt, not base mannequin

Rationale: the "scalp hairline guide" approach was tested and failed — the
model drew decorative face paint instead of useful texture guides. A side-by-side
test (mid fade straight vs. mid fade curly, same base) confirmed the overlay
prompt alone is sufficient to convey texture.

### Camera angles needed per mannequin
- [x] Front (complete — MAN-01/02/03 job IDs below)
- [ ] Left profile
- [ ] Right profile
- [ ] Back
- [ ] Full 3D scan (future)

## Base mannequin job IDs (front view)

| ID     | Skin Tone | Higgsfield Job ID                          |
|--------|-----------|--------------------------------------------|
| MAN-01 | Light     | 70d6cf68-68d1-4850-9778-315b376e8adf       |
| MAN-02 | Medium    | 11dfd0d9-4a5a-465a-bff0-e49a1ceb98cb       |
| MAN-03 | Deep      | 6897b1c2-753f-4917-8e0b-66e8fbafeee2       |

## Base character references (approved face/skin references)

Stored in `consultation-app/app/data/base-characters.json`.
Images saved locally in `consultation-app/app/images/mannequins/base-characters/`.

| ID        | Skin Tone | Higgsfield Job ID                          |
|-----------|-----------|--------------------------------------------|
| BC-light  | Light     | 1206b020-9148-4142-aeca-83d6bcfa4b98       |
| BC-medium | Medium    | 851f4a6d-9a8b-45ca-ab10-06923db6073a       |
| BC-deep   | Deep      | 735b2fd4-abe0-48c8-a4f5-f926f7ea2f32       |

## Prompt templates

**Base mannequin prompt (no texture guide):**
> A photorealistic 3D-rendered neutral mannequin head, completely bald (no
> hair), with [light/medium/deep] skin tone. [Camera angle phrase]. Both ears
> clearly visible (front/back) or one ear visible (profile). Neutral relaxed
> facial expression. Plain light-grey seamless studio background, soft even
> studio lighting.

Camera angle phrases:
- Front: "Front-facing, direct eye-level camera angle"
- Left profile: "Left side profile view, eye-level camera angle"
- Right profile: "Right side profile view, eye-level camera angle"
- Back: "Rear-facing, direct eye-level camera angle"

**Haircut overlay prompt:**
> Apply a [STYLE_NAME] hairstyle to the mannequin head, styled for
> [HAIR_TEXTURE] hair texture. Keep the same face, skin tone, camera angle,
> and plain light-grey studio background. Front-facing view, both ears visible
> unless the hairstyle naturally covers them, consistent studio lighting,
> neutral expression, photorealistic, high detail. Do not alter the face, skin
> tone, or background — change only the hair.

## Fade placement guidelines (backlog)

**Open question:** How to communicate low/mid/high fade placement and skin
fades to the model. Options to investigate:
- Anatomical landmark language in the prompt (e.g. "fade starts at the
  occipital bone", "skin fade begins 1 finger above the ear")
- Side/back profile views make placement clearer than front-only
- Separate reference image with anatomical guide lines (not scalp paint)
- Test whether model already understands "low fade", "mid fade", "high fade"
  from text alone on the profile/back views

## Credit tracking

- Balance before this session: 936 credits
- 12 base mannequin generations (front, with scalp lines — deprecated): 12 credits
- 2 overlay test generations (mid fade straight vs. curly): 2 credits
- Balance as of now: ~922 credits remaining (verify with balance check)

## Status

| Step | Status |
|---|---|
| Define mannequin matrix (3 skin tones, no face shapes, no texture in base) | Done ✓ |
| Approve 3 base character faces (BC-light / BC-medium / BC-deep) | Done ✓ |
| Save base character images locally | Done ✓ |
| Generate front-view base mannequins (MAN-01/02/03) | Done ✓ |
| Test: does hair texture in base affect overlay? | Done ✓ — No difference; texture goes in overlay prompt |
| Generate left profile, right profile, back for MAN-01/02/03 | In progress |
| Get user sign-off on all angles | Not started |
| Generate haircut-overlay images (front view first) | Not started |
| Investigate fade placement guideline approach | Backlog |
| Full 3D scan of each mannequin | Future |
| Define women's mannequin matrix | Not started |

## What's needed to resume in a new chat

1. Open a new conversation and say you're continuing the Higgsfield mannequin pilot.
2. Point Claude at this file: `/Users/Bryan/Pleroma/higgsfield-mannequin-plan.md`.
3. Data files: `/Users/Bryan/Pleroma/consultation-app/app/data/`
4. Current step: generate left profile, right profile, and back view for
   MAN-01 (Light), MAN-02 (Medium), MAN-03 (Deep) using their front-view
   job IDs as references.

## Profile job IDs (side & back views)

| Mannequin | View         | Higgsfield Job ID                          | Local File                              |
|-----------|--------------|--------------------------------------------|-----------------------------------------|
| Light     | Left profile | 24e811da-1a9f-4d33-873c-eb6741024a61       | mannequins/light/left.png               |
| Light     | Right profile| f4d3c8e6-08fd-49e1-95ec-79f41700d915       | mannequins/light/right.png              |
| Light     | Back         | 71471b0d-2ba9-4757-b413-9581211f95df       | mannequins/light/back.png               |
| Medium    | Left profile | 25329434-f791-499f-86ed-2aa08dccf4bf       | mannequins/medium/left.png              |
| Medium    | Right profile| 5aa5ce36-73c9-4132-9697-f12a06ccf545       | mannequins/medium/right.png             |
| Medium    | Back         | 25179565-a093-40a6-b6b3-0e3ec8659ff1       | mannequins/medium/back.png              |
| Deep      | Left profile | 6d35bfad-8e94-49b8-bc7c-429f6438db2a       | mannequins/deep/left.png                |
| Deep      | Right profile| 49a02b24-cb20-4125-a201-492bcc9270d6       | mannequins/deep/right.png               |
| Deep      | Back         | 51a50f24-1c5c-4576-bb1c-d9a1fe615c0f       | mannequins/deep/back.png                |

Prompt used for all profiles:
"A photorealistic bald human male, with [skin tone]. [View] view, eye-level camera angle.
Preserve the exact facial features, skull shape, ear shape, and skin tone as the reference image.
Neutral relaxed facial expression. Plain light-grey seamless studio background, soft even studio lighting."

Base character CDN URLs used as reference (fresh import before each generation):
- Light: hf_20260715_162032_1206b020-9148-4142-aeca-83d6bcfa4b98.png
- Medium: hf_20260715_162312_851f4a6d-9a8b-45ca-ab10-06923db6073a.png
- Deep: hf_20260715_162319_735b2fd4-abe0-48c8-a4f5-f926f7ea2f32.png
