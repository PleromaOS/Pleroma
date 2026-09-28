// Turns a door's refusal into one sentence a client understands.
// A client never sees a code like "shop_capacity_reached"; they see what it
// means for them and what they can do next.

import { DoorError } from "../api/errors";

const WORDS: Record<string, string> = {
  offline: "No connection. Check your internet and try again.",
  slow_down: "Too many tries from this connection. Give it a few minutes.",
  shop_unavailable: "This offer isn't available any more.",
  ticket_invalid: "This consultation has expired. Start a new one.",
  consultation_closed: "This consultation is already finished.",
  email_invalid: "That email address doesn't look right.",
  consultation_already_has_a_client: "This consultation already belongs to another email.",
  email_required_first: "We need your email first.",
  selfie_consent_required: "Turn on the switch to agree to your photos being used.",
  style_and_texture_required: "Pick your hair type and a cut first.",
  style_not_offered_for_this_texture: "That cut isn't offered for your hair type. Pick another.",
  render_already_running: "Your render is already on its way.",
  no_renders_left: "You've used all your renders for this consultation.",
  too_many_attempts: "Something keeps going wrong with this photo. Try a new one, in good light.",
  shop_capacity_reached: "This shop's free consultations are fully booked this month. Try again next month.",
  photo_too_large: "That photo is too large. Try again.",
  photo_required: "We need your photos first.",
  photo_missing_or_too_large: "One of your photos didn't come through. Scan again.",
  photo_not_jpeg: "One of your photos didn't come through. Scan again.",
  photo_too_small: "Your photos are too small to read your hair from. Scan again with the camera.",
  could_not_store_photo: "Your photos couldn't be saved just now. Try again.",
  could_not_record_photo: "Your photos couldn't be saved just now. Try again.",
  renderer_unavailable: "Our render service is busy. Try again in a minute.",
  render_not_confirmable: "This render can't be confirmed. Try again.",
  terms_version_required: "Something went wrong confirming. Try again.",
  photos_required: "We need your photos first.",
  reading_failed: "We couldn't read your photos just now. Try again in a moment.",
  reading_already_running: "We're still reading your photos.",
  reading_not_ready: "We're still reading your photos.",
  reading_not_found: "Something went wrong with your reading. Scan again.",
  value_not_allowed: "That answer didn't save. Try again.",
  confirm_render_first: "Confirm your cut first.",
  reading_required: "We need to read your photos first.",
  could_not_start_twin: "Your AI twin couldn't be started just now. Try again.",
  twin_not_found: "Something went wrong with your AI twin. Try again.",
  no_twin_attempts_left: "No more AI twins for this consultation. We'll use your own photo.",
};

export function explain(e: unknown): string {
  if (e instanceof DoorError) return WORDS[e.code] ?? "Something went wrong. Try again.";
  return "Something went wrong. Try again.";
}
