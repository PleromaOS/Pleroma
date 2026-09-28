-- 2026-09-28 · renders_on_twin_three_angles (applied to the live database)
-- The new cut drawn on the AI twin, from three angles, each truth-checked.
alter table public.renders
  add column source_kind text not null default 'photo' check (source_kind in ('photo', 'twin')),
  add column source_bucket text not null default 'client-photos' check (source_bucket in ('client-photos', 'ai-twins')),
  add column twin_id uuid references public.ai_twins(id) on delete set null,
  add column side_a_source text,
  add column side_b_source text,
  add column side_a_path text,
  add column side_b_path text,
  add column pending_views text[] not null default '{}',
  add column truth_check jsonb not null default '{}'::jsonb,
  add column truth_passed boolean,
  add column needs_barber_note boolean not null default false;

create or replace function public.render_view_done(
  p_render uuid, p_view text, p_path text, p_checks jsonb, p_passed boolean, p_error text
) returns void language plpgsql set search_path = public as $$
begin
  update renders set
    output_path = case when p_view = 'front' and p_path is not null then p_path else output_path end,
    side_a_path = case when p_view = 'side_a' and p_path is not null then p_path else side_a_path end,
    side_b_path = case when p_view = 'side_b' and p_path is not null then p_path else side_b_path end,
    truth_check = truth_check || jsonb_build_object(p_view, coalesce(p_checks, '[]'::jsonb)),
    truth_passed = case when p_view = 'front' then (p_path is not null and p_passed) else truth_passed end,
    needs_barber_note = needs_barber_note or (p_path is not null and not coalesce(p_passed, false)),
    error = case when p_error is not null then coalesce(error || '; ', '') || p_view || ': ' || p_error else error end,
    status = case when p_view = 'front' then (case when p_path is not null then 'succeeded' else 'failed' end) else status end,
    pending_views = case when p_view = 'front' and p_path is null then '{}' else array_remove(pending_views, p_view) end,
    updated_at = now()
  where id = p_render;
end;
$$;
revoke all on function public.render_view_done(uuid, text, text, jsonb, boolean, text) from public, anon, authenticated;
