# pleroma-app — the client app

The React app a client uses: from the advert (or the QR code in the shop) to a
confirmed brief and a booking link or walk-in pass. It talks to the backend
only through the doors in `consultation-app/supabase/functions/` (ADR 0014).

## Addresses

| Address | What it is |
|---|---|
| `/<shop-slug>` | a stranger from the shop's advert (campaign entry) |
| `/<shop-slug>/in-shop` | the QR code in the shop's waiting area |
| add `?demo` | every door simulated in the browser: nothing saved, no render spent |

The test shop is `pleroma-test`, so `/pleroma-test?demo` is the safe way to click around.

## Running it on your Mac

Ask Claude Code to do this, or in Terminal inside this folder:

```
npm install      # once: downloads React and the build tools into node_modules/
npm run dev      # starts the app at http://localhost:5173
```

Then open `http://localhost:5173/pleroma-test?demo`.
Without `?demo` it uses the real doors, creates real records in the test shop,
and a render costs real Gemini credit.

The phone camera only works on a secure (https) address, so testing the selfie
on a real phone needs the app hosted (see "Not done yet").

## Where things are

| Folder | What lives there |
|---|---|
| `src/screens/` | one file per room of the floor plan, each naming its widget (W20, W34…) |
| `src/components/` | the building blocks every screen reuses (W01 chassis, tiles, badge) |
| `src/api/doors.ts` | the only place the app talks to the backend about a consultation |
| `src/api/demo.ts` | the simulated doors for `?demo` |
| `src/data/vocabulary.ts` | the words a client sees for each stored answer |
| `src/flow/` | the order of the rooms, and the one consultation record they share |
| `src/styles/tokens.css` | a copy of `ui/tokens.css`. Change the original, then copy it here |

## Not done yet

- **W21 Render reveal** has no locked design; `screens/Reveal.tsx` is a placeholder.
- **Photos.** The texture close-ups, the landing example and most style tiles
  show placeholders until photos are added.
- **"Don't see your cut? Upload a photo"** (the reference-upload route) is not built.
- **Hosting.** The app needs a web address with https before a phone can use
  the camera or a shop can run an advert to it.
- **Email** (see `docs/LAUNCH-CHECKLIST.md`).
