-- Applied 28 Sep 2026 (migration "renders_busy_at").
-- When Google last answered "busy" while this render was being drawn.
-- The kitchen keeps trying for about ten minutes (hair-transfer, patient.ts);
-- render-status reads this to tell the app "busy, still trying".
alter table public.renders add column if not exists busy_at timestamptz;
comment on column public.renders.busy_at is 'Last time the image AI answered busy for this render; the kitchen keeps retrying for about 10 minutes.';
