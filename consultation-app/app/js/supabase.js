/**
 * Pleroma — Supabase integration.
 *
 * Exposes two async functions on window.PleromaDB:
 *
 *   saveConsultation(payload) → { id } | null
 *     Inserts a row into `consultations`. Returns the new UUID so the
 *     caller can link a subsequent feedback row.
 *
 *   saveFeedback(payload) → void
 *     Inserts a row into `feedback`.
 *
 * Both functions swallow errors gracefully — if Supabase is unreachable
 * the app keeps working; the failure is logged to the console.
 */
(function () {
  "use strict";

  const SUPABASE_URL     = "https://eusyxqguevqgrnnjqhut.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1c3l4cWd1ZXZxZ3JubmpxaHV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNjUxMDMsImV4cCI6MjA5OTc0MTEwM30.AjWfEIUeE1giPrB7XT37sEBsKZvfyHg4qRHnrI_m9_E";

  const HEADERS = {
    "Content-Type": "application/json",
    "apikey":       SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    "Prefer":       "return=representation",
  };

  /**
   * Insert a consultation record.
   *
   * @param {{
   *   styleId: string, styleName: string, styleFamily: string,
   *   texture: string, skinTone: string, fadeHeight: string,
   *   refinements: object, barberSpec: object[]
   * }} payload
   * @returns {Promise<string|null>} the new consultation UUID, or null on error
   */
  async function saveConsultation(payload) {
    try {
      const body = {
        style_id:     payload.styleId,
        style_name:   payload.styleName,
        style_family: payload.styleFamily,
        texture:      payload.texture    || null,
        skin_tone:    payload.skinTone   || null,
        fade_height:  payload.fadeHeight || null,
        refinements:  payload.refinements  || null,
        barber_spec:  payload.barberSpec   || null,
      };

      const res = await fetch(`${SUPABASE_URL}/rest/v1/consultations`, {
        method:  "POST",
        headers: HEADERS,
        body:    JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.text();
        console.warn("[PleromaDB] saveConsultation failed:", err);
        return null;
      }

      const [row] = await res.json();
      return row ? row.id : null;

    } catch (e) {
      console.warn("[PleromaDB] saveConsultation error:", e);
      return null;
    }
  }

  /**
   * Insert a feedback record.
   *
   * @param {{
   *   consultationId: string|null,
   *   styleId: string, styleName: string,
   *   texture: string, skinTone: string, fadeHeight: string,
   *   rating: number  (0–100)
   * }} payload
   */
  async function saveFeedback(payload) {
    try {
      const body = {
        consultation_id: payload.consultationId || null,
        style_id:        payload.styleId,
        style_name:      payload.styleName,
        texture:         payload.texture    || null,
        skin_tone:       payload.skinTone   || null,
        fade_height:     payload.fadeHeight || null,
        rating:          Number(payload.rating),
      };

      const res = await fetch(`${SUPABASE_URL}/rest/v1/feedback`, {
        method:  "POST",
        headers: HEADERS,
        body:    JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.text();
        console.warn("[PleromaDB] saveFeedback failed:", err);
      }
    } catch (e) {
      console.warn("[PleromaDB] saveFeedback error:", e);
    }
  }

  window.PleromaDB = { saveConsultation, saveFeedback };
})();
