// patient.ts — what to do when Google says "busy" (Bryan, 28 Sep).
//
// What it does:   when the AI answers "busy" (503, 429, a 500-type error, or
//                 no answer in time), it waits a few seconds and asks again,
//                 for as long as the job has time. When the job's time is up
//                 and Google is still busy, it says so (StillBusy), and the
//                 job hands the same work to a fresh job ("relay"), which
//                 starts with a new 150 seconds. Each job keeps asking for
//                 about a minute (it must leave time for the truth check),
//                 so MAX_RELAYS fresh jobs give about ten minutes in all.
// What it does NOT do: it never retries a real refusal (a bad picture, a
//                 blocked request): those fail at once, because asking again
//                 would only cost money. It never waits past the job's own
//                 time limit.
// Why: busy spells on Google's shared door last minutes. Before this, a job
//      gave up after about 30 seconds and the client saw a failure.

export const MAX_RELAYS = 9;          // 1 job + 9 fresh ones, about a minute each ≈ 10 minutes
const PAUSE_MS = 8_000;               // between two tries
const ROOM_FOR_ONE_TRY_MS = 45_000;   // a picture takes 25–40 s; don't start one without this

export class StillBusy extends Error {}

export function isBusy(e: unknown): boolean {
  const s = String(e);
  return /\b(429|500|502|503|504)\b|UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded|high demand|TimeoutError|aborted|timed out|too slow/i.test(s);
}

// Ask, and keep asking while the answer is "busy", until `until` (a clock time).
export async function patiently<T>(ask: () => Promise<T>, until: number, onBusy?: (tries: number, e: unknown) => void): Promise<T> {
  for (let tries = 1; ; tries++) {
    try {
      return await ask();
    } catch (e) {
      if (!isBusy(e)) throw e;
      onBusy?.(tries, e);
      if (Date.now() + PAUSE_MS + ROOM_FOR_ONE_TRY_MS > until) throw new StillBusy(String(e).slice(0, 200));
      await new Promise((r) => setTimeout(r, PAUSE_MS));
    }
  }
}

// Hand the same work to a fresh job. The caller says who may call the job.
export function relay(fn: string, body: Record<string, unknown>, headers: Record<string, string>) {
  return fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/${fn}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}
