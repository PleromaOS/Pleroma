# Pleroma — Personalized Flow Spec (v2 — supersedes v1)

This replaces the original 6-question binary-tree design described in
v1 (below history retained only in git/version history, not here). That
version had three real logic flaws, found through direct review: it
grouped Straight/Wavy into one texture choice with no way to tell them
apart (both for scoring and for showing an accurate reference image);
it collapsed "length" into a single question that conflated physical
length with styling effort and couldn't represent styles with different
top vs. back length (e.g. a mullet); and it gave a standalone fade
question the same scoring weight as fundamental attributes like face
shape, when fade is really a detail of whatever style was already
implied. The fix — reviewed style-family by style-family with real
barbering input — is a family-first flow instead of an attribute-guessing
one: the client picks a general haircut silhouette early (shown as
pictures, not text, since vocabulary gaps are expected), and the rest of
the questions only ask what actually varies within that family, using a
small set of shared/reusable questions instead of one-off ones.

## Two pathways, one rule

- **Generic path** — client answers preference questions only. No
  photos, no diagnostic data, no barber input, ever — that would cost
  the barber time per haircut, which isn't something Pleroma should ask
  of them.
- **Precision path** — client submits 4 photos (face, sides, top, back).
  Diagnostic attributes (growth direction, natural part, hairline shape,
  crown thinning/density, current length/thickness, ear visibility
  baseline) are extracted from those photos by the system — the barber
  still never types anything in.

Both pathways share the same family-first question tree below. Precision
adds the photo step first (so family-picker reference images can be
shown rendered on the client's own texture) and produces a fuller output
(see "Output" below).

## Step 1 — Texture

Asked first, before the family picker, so reference images shown next
match the client's real hair. Fixed from v1: no grouped pairs. Straight
or Wavy is a broad first split with an immediate follow-up to pick the
exact one; same for Curly or Coily. Four possible end states: Straight,
Wavy, Curly, Coily — never a grouped tag.

## Step 2 — Family / style picker

Client is shown pictures (rendered on their own texture) of the general
haircut families and picks one. This immediately narrows the space from
the full catalog down to the 2-4 styles that exist within that family,
rather than trying to score across the whole catalog from scattered
attribute answers.

### Universal axes (reused across most families instead of reinvented per family)

- **Sides/back treatment** — fade (none / low / mid / high / skin),
  taper, or lined up/blocked.
- **Top length** — including "none" (bald/buzzed). Independent of the
  sides/back axis, combinable with any family.
- **Hairline definition** — defined/hard line vs. natural line.
- **Neckline shape** — V-shape, squared, or round. Relevant wherever the
  back of the neck is visible.

### The 10 real families (post barber-expertise review)

| Family | Styles | Family-specific refinement (beyond universal axes) |
|---|---|---|
| Buzz/Crew | Buzz Cut, Crew Cut, Caesar Cut | shape (squared/oval); Buzz: top length/guard; Crew: finish (polished vs. textured); Caesar: fringe shape |
| Crop | French Crop (base — absorbs Textured Crop, Curly Fringe/Crop, Spiky Textured Crop as finish variants) | finish style: straight fringe / textured & tousled / spiked / natural curl (curl option only if texture is Curly/Coily) |
| Pompadour | Classic, Modern with Fade | partition (part side/style); length trajectory (maintain / cut shorter / grow out) |
| Classic Men's Haircut (renamed from Slick Back; absorbs Side Part) | — | styling: wet slicked-back / blowdried / defined side part; taper transition point at neck & sideburn if no fade |
| Comb Over | Comb Over, Comb Over Fade | hard line vs. natural line; direction (left-to-right / right-to-left); part/separation position |
| Flat Top | Flat Top | texture-locked to Coily hair only; top height; hairline sharpness |
| Mohawk | Mohawk, Fauxhawk | Fauxhawk: top length; Mohawk: neckline shape |
| Afro/Textured | Curly Afro (natural), Afro Fade | universal sides axis only |
| Mullet | Modern Mullet, Classic Mullet | back length (short/medium/long); sides length; taper level if any |
| Fringe | Curtains/Middle Part Fringe | universal sides axis + hairline definition |

### Removed from the catalog (not real standalone haircuts, or out of scope)

- **Quiff** — removed entirely.
- **Side Part** — folded into Classic Men's Haircut as a styling option.
- **Undercut** (Classic, Slick Back, Textured Top) — removed entirely.
- **Long** (Man Bun/Top Knot, Long Layered, Curly Shag) — women's styles,
  out of scope for the current men's-focused catalog.
- **Twists/Locs** (Short Twists, Twists Fade, Dreadlocks/Locs) — removed;
  most barbershops don't offer these.
- **Fade** family (Low/Mid/High/Skin Fade Crop, Bald Taper, Coily Taper)
  — dissolved. Fade height and "no top length" are universal axes, not
  styles. "Coily Taper" wasn't a real style — coily is a texture, not a
  haircut name.

Net: 16 original families → 10 real families, plus 4 shared universal
questions replacing what used to be duplicated (or wrongly invented,
like the old "Fade" family) across many entries.

## Output

Every result — both pathways — includes both a style name headline
(client-facing, and reused in the client's visit history) and the full
technical spec underneath (diagnostic attributes if Precision + every
preference answer) written the way a barber would want it handed to
them chair-side.

## Implementation status (not yet rebuilt)

`haircuts.json`, `data.js`, `scoring.js`, and `app.js` still implement
the old v1 flow described above (grouped texture, single length
question, standalone fade scoring, additive point system). None of this
has been rebuilt yet — this doc describes the target design; the code
rewrite is a separate, not-yet-started task. When it happens: `data.js`
becomes the family-first tree + universal axes (still plain data,
kept separate from UI wiring in `app.js`); `scoring.js`'s additive
point system goes away in favor of the family filter + refinement
answers directly selecting the matching style(s), since scoring across
41 styles from scattered attributes is exactly the approach being
replaced.

## Still open

- Explainer images needed for every universal axis and every
  family-specific refinement question above.
- Barber-spec output format (what it looks like on the page/ticket)
  still needs review.
