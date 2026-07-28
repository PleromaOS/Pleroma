# Admin Dashboard uses matrix view — Barbers vs. Styles with accuracy metrics

The Admin Dashboard is where Shop Owners measure Barber performance. We considered (a) per-Barber cards showing top/bottom 5 styles (narrative format), (b) ranked leaderboard (Barbers sorted by overall accuracy %), and (c) a matrix view (Barbers as rows, Styles as columns, cells show % accuracy for that combo).

We chose option (c): matrix view.

**Trade-offs:**

**Why matrix:**
- **Pattern recognition**: Owner can instantly see which Barber excels at which Styles. E.g., "Barber A nails Fades (95%) but struggles with Pompadours (60%)." This is visible at a glance, not buried in narrative.
- **Training clarity**: Patterns reveal exactly where to focus. If multiple Barbers are weak on Fades, invest in fade training. If one Barber is weak on everything, they may need mentorship.
- **Cross-shop comparison** (future): If Pleroma scales to multi-shop, matrix format scales cleanly. Leaderboards become hard to read with 100+ Barbers; matrix does not.
- **Data density**: Owner can see style popularity and accuracy distribution in one view. Narrative formats require clicking/scrolling.

**Why not per-Barber cards:**
Cards are narrative-friendly and easier to design for mobile, but they hide patterns. Owners have to click each Barber to understand the full picture. For a small shop (5-8 Barbers), a matrix is still digestible on tablet, which is the primary Admin Dashboard device.

**Why not leaderboard:**
Leaderboards are simple but lose nuance. A Barber ranked #2 overall might be excellent at Fades (90%) but weak at Tapers (50%). Leaderboard doesn't surface this; owners have to drill in to find it.

**Data sources:**
Accuracy % is calculated from Feedback + Delivery Reports:
- **Client Feedback**: "Did you get what you asked for?" (Yes/No/Partial).
- **Barber Delivery Report**: "Did I deliver as requested?" (Yes/No/Partial).
- **Accuracy Score**: Where both Client feedback and Barber report agree, the accuracy is high. Disagreement flags training opportunities.
- **Style mapping**: Each Consultation tags a primary Style (Fade, Taper, Pompadour, etc.). Over time, accuracy % per Barber per Style is tracked.

**Visualization details:**
- Rows are Barbers (sortable by name, overall accuracy, or by any column).
- Columns are Styles (ordered by popularity or alphabetically).
- Cells show % accuracy (e.g., "95%", "73%", "—" for no data yet).
- Color coding optional (green = high, yellow = medium, red = low) to aid scanning.
- Empty cells ("-") for Barber/Style combos with no data yet.
- Hover/click on a cell to see underlying Consultations (drill-down to raw feedback).

**Responsive design:**
For small shops (2-3 Barbers, 5-8 Styles), the matrix fits on a tablet in landscape. For larger shops, it might require horizontal scrolling. This is acceptable; owners typically review on tablet, not phone.

**Limitation:**
This approach assumes Styles are well-defined and consistently tagged by Clients. If Clients pick random descriptions instead of preset Styles, the matrix becomes sparse and less useful. Mitigation: ensure Quick Pick and Personalized Consultation both clearly tag a primary Style (Fade, Undercut, Pompadour, etc.).
