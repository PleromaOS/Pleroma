// The app's front door: reads the address and shows the right room.
//
//   /consult/barber-jansen            a stranger from the shop's advert (campaign entry)
//   /consult/barber-jansen/in-shop    the QR code in the shop's waiting area (shop entry)
//   add ?demo to either       every door simulated, nothing saved, no render spent
//
// Why no routing library: the client only ever moves forward through one
// consultation, and the back button is handled inside it. The address only
// needs to say which shop and which entry, and that is two lines of code.

import { useEffect } from "react";
import { IS_DEMO, PREVIEW_BUILD } from "./config";
import type { StepId } from "./flow/steps";
import { useConsultation, type Flow } from "./flow/useConsultation";
import { ConfirmCut, ConfirmYou } from "./screens/Confirm";
import { EmailGate } from "./screens/EmailGate";
import { Handoff } from "./screens/Handoff";
import { Landing } from "./screens/Landing";
import { EffortQuestion, LengthQuestion, StyleQuestion, TextureQuestion } from "./screens/Questions";
import { Refine, Reveal } from "./screens/Reveal";
import { Selfie } from "./screens/Selfie";
import { Wait } from "./screens/Wait";

const ROOMS: Record<StepId, (p: { flow: Flow }) => React.ReactNode> = {
  landing: Landing,
  email: EmailGate,
  texture: TextureQuestion,
  length: LengthQuestion,
  style: StyleQuestion,
  effort: EffortQuestion,
  selfie: Selfie,
  wait: Wait,
  reveal: Reveal,
  refine: Refine,
  "confirm-you": ConfirmYou,
  "confirm-cut": ConfirmCut,
  handoff: Handoff,
};

function readAddress() {
  // Drop the "/consult" part the site serves the app under, then read shop and entry.
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const path = window.location.pathname.startsWith(base) ? window.location.pathname.slice(base.length) : window.location.pathname;
  const [shop, second] = PREVIEW_BUILD ? ["demo"] : path.split("/").filter(Boolean);
  return { shop: shop?.toLowerCase(), entry: second === "in-shop" ? "shop" as const : "campaign" as const };
}

export default function App() {
  const { shop, entry } = readAddress();
  if (!shop) {
    return (
      <main className="page">
        <h1 className="display">PleromaOS</h1>
        <p className="lede">This link is missing the shop. Try <a href={`${import.meta.env.BASE_URL}pleroma-test`}>the test shop</a>.</p>
      </main>
    );
  }
  return <Consultation shop={shop} entry={entry} />;
}

function Consultation({ shop, entry }: { shop: string; entry: "campaign" | "shop" }) {
  const flow = useConsultation(shop, entry);
  const Room = ROOMS[flow.c.step];
  // Every new room starts at the top, not where the last one was scrolled to.
  useEffect(() => { window.scrollTo(0, 0); }, [flow.c.step]);
  return (
    <>
      {IS_DEMO && (
        <div className="demo-bar">
          Demo mode · nothing is saved
          <button onClick={flow.restart}>Restart</button>
        </div>
      )}
      <Room flow={flow} />
    </>
  );
}
