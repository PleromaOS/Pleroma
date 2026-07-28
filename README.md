# Pleroma

**AI-powered haircut consultations for barbershops.**

Clients see exactly what they'll look like before they sit down. Barbers deliver with confidence. Shop owners measure accuracy and identify training needs.

---

## What Is Pleroma?

Pleroma is a client-facing web app that sits in the barbershop. When a Client is ready for a consultation, they scan a QR code, upload a photo (optional), and see an AI-generated preview of their exact look with their selected style applied. The Barber gets a clear brief. The Client sees the result before the cut. Everyone wins.

**Core principle:** Every feature in Pleroma should be intuitive enough that anyone can use it without explanation.

---

## Quick Start

- **For product understanding:** Read [`CONTEXT.md`](./CONTEXT.md) — domain glossary and relationships
- **For architecture decisions:** Read [`docs/adr/`](./consultation-app/docs/adr/) — why we chose specific approaches
- **For implementation specs:** Read [`docs/specs/`](./docs/specs/) — flow details and requirements
- **For legal:** Read [`docs/legal/`](./docs/legal/) — privacy policy, data deletion, compliance
- **For brand:** Read [`brand/`](./brand/) — colors, design system, guidelines

---

## Folder Structure

```
/Pleroma/
├── README.md                    ← you are here
├── CONTEXT.md                   ← shared domain glossary (applies to all products)
├── .gitignore                   ← version control exclusions
│
├── docs/
│   ├── adr/                     ← Architecture Decision Records (applies across products)
│   ├── specs/                   ← Shared flow specs, requirements, implementation details
│   │   ├── feedback-loop-spec.md
│   │   ├── personalized-flow-spec.md
│   │   └── higgsfield-mannequin-plan.md
│   ├── legal/                   ← Privacy policy, terms, data handling
│   │   ├── privacy-policy.md
│   │   ├── data-deletion-policy.md
│   │   └── terms-of-service.md (TBD)
│   └── research/                ← User research, market findings, business planning
│       └── Pleroma_Business_Plan.docx
│
├── brand/
│   ├── README.md                ← Brand guidelines & principles
│   ├── colors.json              ← Brand colors (hex, RGB, usage)
│   ├── design-system/           ← Visual design system
│   │   └── pleroma-design-system.html
│   ├── logos/                   ← Brand logo assets
│   └── mockups/                 ← UI mockups & references
│
├── product/
│   ├── consultation-app/        ← Core app (Client consultation + Staff View + Admin Dashboard)
│   │   ├── CONTEXT.md           ← (linked to root CONTEXT.md)
│   │   ├── app/                 ← Application code
│   │   │   ├── index.html
│   │   │   ├── js/, css/        ← App logic & styling
│   │   │   ├── data/            ← App data (haircuts, mannequins, etc.)
│   │   │   └── images/          ← Product assets
│   │   ├── docs/
│   │   │   ├── adr/             ← App-specific architecture decisions
│   │   │   ├── MVP_GRILLING_CHECKLIST.md
│   │   │   └── Pleroma_Haircut_Database_v1.xlsx
│   │   └── test/                ← Test suite
│   │
│   └── landing-site/            ← Marketing landing page
│       └── index.html
│
├── .claude/                     ← Claude Code settings & custom skills
└── .github/                     ← GitHub workflows, issue templates (when public)
```

---

## Key Documents

### Product & Domain
- **[CONTEXT.md](./CONTEXT.md)** — Shared glossary (Shop, Barber, Client, Return Client, etc.)
- **[docs/adr/](./consultation-app/docs/adr/)** — Architecture decisions (9 ADRs, covering Barber PINs, AI clones, GDPR deletion, etc.)
- **[docs/specs/](./docs/specs/)** — Implementation specs (feedback flow, personalized consultation, mannequin plan)

### Legal & Compliance
- **[docs/legal/privacy-policy.md](./docs/legal/privacy-policy.md)** — GDPR-compliant privacy policy
- **[docs/legal/data-deletion-policy.md](./docs/legal/data-deletion-policy.md)** — Client data deletion (90-day anonymization)
- **[docs/legal/terms-of-service.md](./docs/legal/terms-of-service.md)** — (Placeholder)

### Brand
- **[brand/README.md](./brand/README.md)** — Brand guidelines & principles
- **[brand/colors.json](./brand/colors.json)** — Color palette (hex, RGB, usage)
- **[brand/design-system/](./brand/design-system/)** — Visual design system
- **[brand/logos/](./brand/logos/)** — Logo assets
- **[brand/mockups/](./brand/mockups/)** — UI mockups & references

### Implementation
- **[product/consultation-app/](./product/consultation-app/)** — Core application code, data, tests
- **[product/landing-site/](./product/landing-site/)** — Marketing landing page (live at [lambent-florentine-1c4503.netlify.app](https://lambent-florentine-1c4503.netlify.app))

---

## Current Status

🔧 **Design phase** — Domain model locked. 9 architecture decisions recorded. Privacy & data deletion policies finalized. Landing page live.

**Next:**
- [ ] Finalize remaining domain edges (grilling sessions ongoing)
- [ ] Build consultation-app (Quick Pick + Personalized flows)
- [ ] Implement Admin Dashboard
- [ ] Point pleromaos.nl domain to live site

---

## Contributing

**For domain questions:** Refer to `CONTEXT.md`. If unclear, update it.

**For architectural decisions:** Refer to `docs/adr/`. If a decision isn't recorded, create a new ADR.

**For privacy/legal questions:** Refer to `docs/legal/`.

**For brand consistency:** Refer to `brand/README.md` and `brand/colors.json`.

**For app implementation:** Refer to `product/consultation-app/docs/`.

---

## Team

- **Product & Domain:** Bryan
- **Design & Brand:** [Brand/Design System]
- **Development:** [TBD]

---

## Questions?

Refer to the folder structure above, or start with `CONTEXT.md` if you're new to Pleroma.
