// NOTE (28 Sep): the deployed test tool (version 10) is a trimmed copy of this file:
// no ?diag route. It uses patient.ts with MAX_RELAYS = 4. TEST ONLY: delete before launch.
// edit-lab — TEST ONLY, not used by the app (remove before launch).
// 1. Tries a "beard only" edit on an existing finished render, with no example photo.
// 2. Tests patient.ts (the same file hair-transfer uses): fakeBusy makes the
//    first N asks answer "busy", so we can watch it wait and relay.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { MAX_RELAYS, patiently, relay, StillBusy } from "./patient.ts";

const LAB = "3e576a891f1d4e388a457beb81b854b9";
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const MODEL = Deno.env.get("GEMINI_IMAGE_MODEL") ?? "gemini-3-pro-image";
const img = (b: string) => ({ inline_data: { mime_type: b.startsWith("iVBOR") ? "image/png" : "image/jpeg", data: b } });
function toB64(u8: Uint8Array) { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000)); return btoa(s); }
const fromB64 = (b: string) => Uint8Array.from(atob(b), (c) => c.charCodeAt(0));
const dims = (u: Uint8Array) => { const v = new DataView(u.buffer, u.byteOffset); return u[0] === 0x89 ? [v.getUint32(16), v.getUint32(20)] : [3, 4]; };
function ratioOf(w: number, h: number) {
  const opts: [string, number][] = [["1:1",1],["3:4",.75],["4:3",4/3],["2:3",2/3],["3:2",1.5],["9:16",9/16],["16:9",16/9],["4:5",.8],["5:4",1.25]];
  return opts.reduce((a, b) => Math.abs(b[1] - w / h) < Math.abs(a[1] - w / h) ? b : a)[0];
}
async function gemini(parts: unknown[], ratio: string, deadline: number, model = MODEL) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${Deno.env.get("GEMINI_API_KEY")}`, {
    method: "POST", signal: AbortSignal.timeout(Math.max(1000, deadline - Date.now())), headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts }], generationConfig: { imageConfig: { imageSize: "2K", aspectRatio: ratio } } }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`gemini ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
  for (const p of j.candidates?.[0]?.content?.parts ?? []) { const d = p.inlineData?.data ?? p.inline_data?.data; if (d) return d as string; }
  throw new Error(`no image (${j.candidates?.[0]?.finishReason})`);
}
const say = (b: Record<string, unknown>, what: string) => console.log(`LAB ${b.tag} part=${b.part} job=${b.relayNo} ${what}`);

async function job(b: Record<string, any>) {
  const started = Date.now();
  const until = started + 125_000;
  let fake = Number(b.fakeBusy ?? 0);
  try {
    const i = b.part === "front" ? 0 : Number(b.part);
    const d = await sb.storage.from("renders").download(b.views[i]);
    if (d.error) throw new Error("download " + d.error.message);
    const src = new Uint8Array(await d.data.arrayBuffer());
    const extra: unknown[] = [];
    if (i > 0) {
      const f = await sb.storage.from("renders").download(`lab/${b.tag}-0.png`);
      if (f.error) throw new Error("front missing");
      extra.push({ text: "IMAGE 2:" }, img(toB64(new Uint8Array(await f.data.arrayBuffer()))));
    }
    const parts = [{ text: i === 0 ? b.prompt : b.sidePrompt }, { text: "IMAGE 1:" }, img(toB64(src)), ...extra];
    const t = Date.now();
    const out = await patiently(async () => {
      if (fake > 0) { fake--; throw new Error("gemini 503 (fake busy for the test)"); }
      return await gemini(parts, ratioOf(dims(src)[0], dims(src)[1]), until, b.model ?? MODEL);
    }, until, (n, e) => say(b, `busy try ${n}: ${String(e).slice(0, 60)}`));
    await sb.storage.from("renders").upload(`lab/${b.tag}-${i}.png`, fromB64(out), { contentType: "image/png", upsert: true });
    say(b, `DONE in ${Math.round((Date.now() - t) / 1000)}s (job ${Math.round((Date.now() - started) / 1000)}s)`);
    if (i === 0 && b.views.length > 1) {
      for (const p of [1, 2].filter((n) => n < b.views.length)) await relay("edit-lab", { ...b, part: p, relayNo: 0, fakeBusy: 0 }, { "x-lab": LAB });
    }
  } catch (e) {
    if (e instanceof StillBusy && Number(b.relayNo ?? 0) < MAX_RELAYS) {
      say(b, `still busy after ${Math.round((Date.now() - started) / 1000)}s: handing to a fresh job`);
      await relay("edit-lab", { ...b, relayNo: Number(b.relayNo ?? 0) + 1, fakeBusy: fake }, { "x-lab": LAB });
    } else say(b, `GAVE UP: ${String(e).slice(0, 200)}`);
  }
}

Deno.serve(async (req) => {
  if (req.headers.get("x-lab") !== LAB) return new Response("no", { status: 401 });
  const url = new URL(req.url);
  if (req.method === "GET" && url.searchParams.get("diag")) {
    // Diagnosis: is the key valid, is there quota/credit, or is the image model overloaded?
    const key = Deno.env.get("GEMINI_API_KEY");
    const base = "https://generativelanguage.googleapis.com/v1beta";
    const out: Record<string, unknown> = { image_model: MODEL, at: new Date().toISOString() };
    const probe = async (name: string, u: string, body?: unknown) => {
      const t = Date.now();
      try {
        const r = await fetch(u, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(60_000) } : { signal: AbortSignal.timeout(20_000) });
        const txt = await r.text();
        let short = txt.slice(0, 600);
        try { const j = JSON.parse(txt); if (j.error) short = JSON.stringify(j.error).slice(0, 900); else if (j.models) short = `${j.models.length} models visible; image-capable: ` + j.models.map((m: { name: string }) => m.name).filter((n: string) => /image/.test(n)).join(", "); else short = "OK: " + JSON.stringify(j.candidates?.[0]?.content?.parts?.map((p: Record<string, unknown>) => Object.keys(p))).slice(0, 200); } catch { /* raw */ }
        out[name] = { status: r.status, secs: Math.round((Date.now() - t) / 100) / 10, answer: short };
      } catch (e) { out[name] = { error: String(e).slice(0, 200) }; }
    };
    const extra = (url.searchParams.get("m") ?? "").split(",").filter(Boolean);
    if (extra.length) {
      for (const m of extra) await probe(`text_${m}`, `${base}/models/${m}:generateContent?key=${key}`, /image/.test(m)
        ? { contents: [{ parts: [{ text: "A plain red circle on white." }] }], generationConfig: { imageConfig: { imageSize: "1K", aspectRatio: "1:1" } } }
        : { contents: [{ parts: [{ text: "Say OK" }] }] });
      await probe("count_tokens_free", `${base}/models/gemini-2.5-flash:countTokens?key=${key}`, { contents: [{ parts: [{ text: "hello" }] }] });
      return new Response(JSON.stringify(out, null, 1), { headers: { "Content-Type": "application/json" } });
    }
    await probe("1_key_and_models", `${base}/models?key=${key}&pageSize=200`);
    await probe("2_text_model", `${base}/models/gemini-3.5-flash:generateContent?key=${key}`, { contents: [{ parts: [{ text: "Say OK" }] }] });
    for (let i = 1; i <= 3; i++) await probe(`3_image_model_try${i}`, `${base}/models/${MODEL}:generateContent?key=${key}`, { contents: [{ parts: [{ text: "A plain red circle on white." }] }], generationConfig: { imageConfig: { imageSize: "1K", aspectRatio: "1:1" } } });
    return new Response(JSON.stringify(out, null, 1), { headers: { "Content-Type": "application/json" } });
  }
  if (req.method === "GET" && url.searchParams.get("sign")) {
    const paths = url.searchParams.get("sign")!.split(",");
    const { data } = await sb.storage.from("renders").createSignedUrls(paths, 1800);
    return new Response(JSON.stringify((data ?? []).map((d) => d.signedUrl)), { headers: { "Content-Type": "application/json" } });
  }
  if (req.method === "GET") {
    const s = await sb.storage.from("renders").createSignedUrl(url.searchParams.get("file")!, 120, { transform: { width: 480, quality: 80 } });
    if (s.error) return new Response(s.error.message, { status: 404 });
    const r = await fetch(s.data.signedUrl);
    return new Response(toB64(new Uint8Array(await r.arrayBuffer())));
  }
  const b = await req.json();
  // Test only: hand one real order to the picture engine with the key only doors hold.
  if (b.forward === "hair-transfer") {
    const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/hair-transfer`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
      body: JSON.stringify(b.body),
    });
    return new Response(await r.text(), { status: r.status });
  }
  b.part ??= "front"; b.relayNo ??= 0;
  EdgeRuntime.waitUntil(job(b));
  return new Response(JSON.stringify({ started: b.tag, part: b.part, job: b.relayNo }), { status: 202 });
});
