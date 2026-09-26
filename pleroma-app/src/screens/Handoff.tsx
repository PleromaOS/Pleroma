// The close.
//   W23 · Booking handoff (variant 1c, "built for coming back"): the render,
//         one sentence, one button to the shop's own booking page.
//   W24 · Consultation pass (walk-in variant): a 4-digit pass to show or say
//         at the desk, spelled out in words so it survives a noisy shop.
// The email carrying the same thing is not built yet (LAUNCH-CHECKLIST.md).

import { Button, GuaranteeBadge, Page } from "../components/ui";
import type { Flow } from "../flow/useConsultation";

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];

export function Handoff({ flow }: { flow: Flow }) {
  const { c } = flow;
  const h = c.handoff;
  if (!h) return null;

  if (h.kind === "booking") {
    return (
      <Page>
        <div className="render render--mid">{c.imageUrl ? <img src={c.imageUrl} alt="Your render" /> : <span>Your render</span>}</div>
        <p className="lede lede--center">
          Your brief is saved and waiting for your <em>barber</em>. Last step: choose a time on {h.shop_name}'s own booking page.
        </p>
        <Button onClick={() => window.open(h.url, "_blank", "noopener")}>Choose a time &#8599;</Button>
        <p className="caption">Opens in a new tab. This page stays here.</p>
      </Page>
    );
  }

  return (
    <Page>
      <section className="pass">
        <p className="pass__eyebrow">Your pass · {h.shop_name}</p>
        <p className="pass__code" aria-label={h.code.split("").join(" ")}>{h.code}</p>
        <p>Show this screen, or say "{h.code.split("").map((d) => WORDS[+d]).join(" ")}".</p>
        {h.address && <p className="pass__small">Walk in any time · {h.address}</p>}
      </section>
      <section className="card card--row">
        <div className="split__img">{c.imageUrl ? <img src={c.imageUrl} alt="Your render" /> : <span>Render</span>}</div>
        <div>
          <p className="eyebrow">Your cut</p>
          {c.eligible && <GuaranteeBadge value="Covered" />}
          <p className="caption">Your barber checks it with you before starting.</p>
        </div>
      </section>
    </Page>
  );
}
