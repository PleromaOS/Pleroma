// W34 · Email gate (variant 1c, "reassurance on demand, live help").
// The render is the reward for the email: asking here is what keeps a shop's
// render spend to identified people (consultation-flow.md, step 2).
// Door 2 links the email to the consultation. Then door 4 records the photo
// consent the client gave on the scan screen: consent belongs to a person,
// and the email is what makes them one. Nothing about the photos has left the
// phone before this point.

import { useMemo, useState } from "react";
import { giveConsent, giveEmail } from "../api/doors";
import { SELFIE_CONSENT_VERSION } from "../config";
import { Button, Disclosure, Page, Problem } from "../components/ui";
import type { Flow } from "../flow/useConsultation";
import { explain } from "../lib/messages";

const VALID = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The common slips on a phone keyboard, offered as a one-tap fix.
const TYPOS: Record<string, string> = {
  "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gmail.co": "gmail.com", "gamil.com": "gmail.com",
  "hotmial.com": "hotmail.com", "hotmail.co": "hotmail.com", "outlok.com": "outlook.com",
  "icloud.co": "icloud.com", "iclod.com": "icloud.com", "live.n": "live.nl", "ziggo.n": "ziggo.nl",
};

export function EmailGate({ flow }: { flow: Flow }) {
  const { c, update, go, back } = flow;
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const trimmed = email.trim();
  const valid = VALID.test(trimmed);
  const suggestion = useMemo(() => {
    const [name, domain] = trimmed.toLowerCase().split("@");
    return domain && TYPOS[domain] ? `${name}@${TYPOS[domain]}` : null;
  }, [trimmed]);

  async function submit() {
    if (!valid || !c.ticket) return;
    setBusy(true); setProblem(null);
    try {
      await giveEmail(c.ticket, trimmed);
      if (c.consentTappedAt) await giveConsent(c.ticket, "render_selfie", SELFIE_CONSENT_VERSION);
      update({ emailGiven: true });
      go("texture");
    } catch (e) {
      setProblem(explain(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page onBack={back}>
      <h1 className="display">Keep your <em>render</em>.</h1>
      <p className="lede">It shows at the end, and lands in your inbox to bring to any visit.</p>

      <label className="field">
        <span className="field__label">Your email</span>
        <input
          type="email" inputMode="email" autoComplete="email" autoCapitalize="none"
          placeholder="name@example.com" value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
      </label>
      {suggestion && (
        <button className="suggest" onClick={() => setEmail(suggestion)}>
          Did you mean <strong>{suggestion}</strong>?
        </button>
      )}

      <Problem message={problem} />
      <Button onClick={submit} disabled={!valid} busy={busy}>
        {valid ? "Continue" : "Enter your email to continue"}
      </Button>

      <Disclosure title="What happens to my email?">
        <p>We send your render and your haircut brief to it, so you can show them at the shop.</p>
        <p>{c.shopName ?? "The shop"} can see it, to match your booking to your brief. Nobody else gets it.</p>
        <p>Every email has a link to delete your details whenever you want.</p>
      </Disclosure>
    </Page>
  );
}
