# Pleroma — Setup Guide
## GitHub → Netlify → pleromaos.nl + Supabase

---

## Step 1 — Push to GitHub

Open **Terminal** and run these commands one by one:

```bash
# Go to your project folder
cd ~/Pleroma

# Remove any partial git state from the sandbox
rm -rf .git

# Initialize fresh
git init
git branch -m main
git add .
git commit -m "Initial commit — landing page, CRM, quiz demo, Supabase"
```

Then go to **github.com/PleromaOS** → click **New repository**:
- Name: `pleroma`
- Visibility: **Private**
- Do NOT add README, .gitignore, or license (we already have them)
- Click **Create repository**

Copy the two commands GitHub shows you (they look like this) and paste them in Terminal:

```bash
git remote add origin https://github.com/PleromaOS/pleroma.git
git push -u origin main
```

✅ Your code is now on GitHub.

---

## Step 2 — Connect Netlify

1. Go to **app.netlify.com** → **Add new site** → **Import an existing project**
2. Choose **GitHub** → authorize if asked → select the `pleroma` repo
3. Build settings:
   - Build command: *(leave empty)*
   - Publish directory: `product/landing-site`
4. Click **Deploy site**

Netlify will give you a random URL like `pleroma-abc123.netlify.app`. The site is live.

From now on: every time you push to GitHub, Netlify auto-deploys. No manual steps.

---

## Step 3 — Connect pleromaos.nl domain

### In Netlify:
1. Go to your site → **Domain management** → **Add custom domain**
2. Type `pleromaos.nl` → click **Verify** → **Add domain**
3. Also add `www.pleromaos.nl` as an alias
4. Netlify will show you **nameservers** — copy them (they look like `dns1.p01.nsone.net`)

### At your domain registrar (where you bought pleromaos.nl):
1. Find DNS / Nameserver settings
2. Replace the current nameservers with the 4 Netlify nameservers
3. Save

DNS propagation takes **15 min – 24 hours**. Netlify will auto-provision an SSL certificate (HTTPS) once it detects the domain.

**Or** if you prefer to keep your current nameservers, add these DNS records instead:
| Type  | Name | Value |
|-------|------|-------|
| A     | @    | 75.2.60.5 |
| CNAME | www  | your-site.netlify.app |

---

## Step 4 — Supabase (already done ✅)

The Pleroma project is already set up. Here's what was configured:

**Project:** `eusyxqguevqgrnnjqhut` (eu-west-1)
**URL:** `https://eusyxqguevqgrnnjqhut.supabase.co`

**Waitlist table** — already created with:
- `id`, `created_at`, `name`, `email`
- `business_type`, `feels_real`, `top_feature`, `big_challenge`
- RLS: anonymous insert ✅ (landing page can write)
- RLS: anonymous read ✅ (CRM can read)

**The landing page** (`product/landing-site/index.html`) now submits directly to Supabase when someone fills the waitlist form.

**The CRM** (`pleroma-crm.html`) now loads signups live from Supabase when you click the Waitlist tab.

---

## How it all connects

```
pleromaos.nl
    │
    ▼
Netlify (auto-deploys from GitHub on every push)
    │
    ▼
product/landing-site/index.html
    │  (form submit)
    ▼
Supabase → waitlist table
    │  (live fetch)
    ▼
pleroma-crm.html → Waitlist tab
```

---

## Daily workflow

1. Edit files in `/Users/Bryan/Pleroma/`
2. Open Terminal → `cd ~/Pleroma && git add . && git commit -m "your message" && git push`
3. Netlify deploys automatically within ~30 seconds
4. Open `pleroma-crm.html` locally → Waitlist tab shows new signups live

---

## Supabase credentials (for reference)

```
URL:      https://eusyxqguevqgrnnjqhut.supabase.co
Anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

To view data directly: **supabase.com** → Pleroma project → Table Editor → waitlist
