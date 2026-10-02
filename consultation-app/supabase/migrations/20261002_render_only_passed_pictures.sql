-- 2 Oct 2026 (handoff 5b, Bryan): no picture reaches the client unless a
-- truth check has run on it and passed.
--
-- Before: a view was "done" whenever a picture existed, passed or not, so a
-- render whose check failed or could not run still became "succeeded" and was
-- shown (render 068af9b0: grey hair borrowed from the example photo while
-- Google's checker was busy).
-- Now: a picture becomes the render's picture (output_path, side_a_path,
-- side_b_path) only when p_passed is true. A front that did not pass makes the
-- render "failed" (the client is told it didn't work and it doesn't count
-- against them). A side that did not pass is simply not shown. Either way the
-- picture's path stays in truth_check (each check names its "picture") and
-- needs_barber_note is set, so nothing is lost for the barber.
create or replace function public.render_view_done(p_render uuid, p_view text, p_path text, p_checks jsonb, p_passed boolean, p_error text)
 returns void
 language plpgsql
 set search_path to 'public'
as $function$
declare
  ok boolean := p_path is not null and coalesce(p_passed, false);
begin
  update renders set
    output_path = case when p_view = 'front' and ok then p_path else output_path end,
    side_a_path = case when p_view = 'side_a' and ok then p_path else side_a_path end,
    side_b_path = case when p_view = 'side_b' and ok then p_path else side_b_path end,
    truth_check = truth_check || jsonb_build_object(p_view, coalesce(p_checks, '[]'::jsonb)),
    truth_passed = case when p_view = 'front' then ok else truth_passed end,
    needs_barber_note = needs_barber_note or (p_path is not null and not coalesce(p_passed, false)),
    error = case when p_error is not null then coalesce(error || '; ', '') || p_view || ': ' || p_error else error end,
    status = case when p_view = 'front' then (case when ok then 'succeeded' else 'failed' end) else status end,
    pending_views = case when p_view = 'front' and not ok then '{}' else array_remove(pending_views, p_view) end,
    updated_at = now()
  where id = p_render;
end;
$function$;
