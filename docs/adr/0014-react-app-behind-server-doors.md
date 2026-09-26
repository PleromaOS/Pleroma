# 14. React app behind server doors

Date: 2026-09-26

## Status

Accepted

## Context

The widget designs exist only as screenshots, in
`consultation-app/app/widgets references/`. Only W01 was ever turned into
code. The assembly contract in `ui/BUILD-PLAN.md` assumed each widget would be
lifted verbatim as a plain HTML `<section>`. With screenshots as the source,
every widget has to be rebuilt from a picture whatever technology is chosen, so
plain HTML no longer has an advantage.

After ADR 0011 the database is fully locked. The client-facing flow is used by
anonymous strangers from an advertisement, who must create records for one
specific shop without being able to read anything.

## Decision

**The app is built in React.** Each widget becomes one reusable component. A
consultation is one shared state that every step reads from and adds to. The
same components serve the client flow, the chair and the staff dashboard.

**The client-facing flow never touches a table. It goes through doors.** A door
is a small server function (Supabase Edge Function) with one job. It checks the
request, then writes with a key the browser never sees.

**The ticket.** Door 1, `start-consultation`, hands the browser a random
ticket. The database keeps only a SHA-256 fingerprint of it
(`consultations.client_token_hash`). Every later door asks for the ticket, so
nobody can write into a consultation they did not start. This works even though
consultation IDs will appear in links and emails.

**The staff dashboard uses logins and row-level security**, because stylists
are known people. It does not go through doors.

## Consequences

The W01 HTML file becomes a visual reference, the same as the screenshots. The
verbatim-lift assembly contract in `ui/BUILD-PLAN.md` is retired.

React needs a build step: code written for developers is compiled into files a
browser can run. There is now a toolchain to maintain that plain pages did not
have.

Every client action needs its own door, so there is more code up front. In
return, each door can be explained in one sentence, and security mistakes stay
inside one small function instead of being spread across rules on eleven
tables.

The dashboard's row-level security rules are still to be written. They are the
most error-prone part of the system.

Losing the ticket (a cleared browser) loses the unfinished consultation. Once an
email is given, that email is the way back in.
