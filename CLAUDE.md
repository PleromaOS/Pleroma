# Working with Bryan on PleromaOS

Read this before doing anything in this repository.

## The hard rule: Bryan understands everything that gets built

Bryan is not a software developer and does not intend to become one. He does
intend to understand his own product completely — every piece, what it does,
why it exists, and why it was built this way and not another way.

**Nothing gets built in this repository without Bryan being able to explain it
back.** That is the standard. Not "was it explained" but "can he explain it."

For every table, column, policy, function, component or file you create or
change, tell him, in plain English, before or alongside the work:

1. **What it is.** In ordinary words. No jargon without defining it first, and
   define it the first time it appears, not the fifth.
2. **What job it does.** What breaks or becomes impossible without it.
3. **What it deliberately does NOT do.** Boundaries are as important as
   capabilities, and a thing that seems to do more than it does is how wrong
   assumptions get built on top of it.
4. **Why this way.** Almost everything can be built several ways. When you pick
   one, say what the alternatives were and why this one suits *this* case —
   the specific trade-off, not a general principle. "It's best practice" is not
   an explanation and is not acceptable here.
5. **What it costs.** What this choice makes harder or more expensive later.
   Every decision has a bill; say who pays it and when.

Never assume something is too basic to explain. If a senior engineer would know
it without thinking, that is exactly the kind of thing Bryan has asked to be
told — the invisible knowledge is the point.

## Pace

Build one piece at a time. One table, one policy, one component. Explain it,
let him absorb it, confirm, then move to the next. Do not batch a migration of
ten tables and summarise it afterwards — that produces a working database he
does not understand, which is the exact outcome this rule exists to prevent.

## When he pushes back

Bryan corrects things, and he has been right. He knows barbering, the client
and the business far better than any model does. When he contradicts something,
work out whether he is correcting a fact you got wrong about his trade, and if
so, change your position and say what it changes downstream.

Disagree when you think he is wrong — that is also owed to him — but say why in
terms of consequences, once, and then follow his decision.

## Where things live

| Question | File |
|---|---|
| What does this word mean in the business? | `CONTEXT.md` |
| Why was this decided, and what did it cost? | `docs/adr/` |
| What are the design rules? | `brand/DESIGN-SYSTEM.md` |
| What does the product actually do, screen by screen? | `docs/specs/consultation-flow.md` |
| Where did the last session stop? What is next? | the newest `docs/HANDOFF-*.md` (now `docs/HANDOFF-2026-09-28-render-reliability.md`) |
| What is built, what is locked? | `ui/REGISTRY.md` |
| How do I build a widget? | `ui/BUILD-PLAN.md` |
| What usability rule did we learn the hard way? | `ux-context.md` |
| What must be done before the first shop goes live? | `docs/LAUNCH-CHECKLIST.md` |

## Language

Plain English. Keep a Dutch term only where it is the real name of something he
will have to use — a legal document, a product, a government form — and put the
English meaning beside it.
