# Data Deletion & GDPR Compliance Policy

**Effective Date:** July 2026  
**Applies to:** All Pleroma Client data

---

## Overview

Pleroma respects Client privacy and complies with GDPR's right to be forgotten. When a Client requests deletion, we remove personal data immediately while retaining anonymized operational records for legal protection and Barber training.

---

## When Deletion Is Requested

A Client can request deletion at any time by:
1. Contacting their Shop Owner
2. Contacting Pleroma directly (support email — TBD)
3. Using an in-app "Delete Profile" button (when implemented)

---

## What Gets Deleted Immediately (Right to Be Forgotten)

When a Client's deletion request is processed, the following personal data is **permanently deleted:**

- ❌ Email address
- ❌ First name
- ❌ AI clone(s) — all biometric data
- ❌ Client PIN (if set)
- ❌ Personal preferences/notes collected during consultations

**Timeline:** Deleted within 24 hours of request.

---

## What Gets Anonymized & Retained

The following records are **anonymized** and retained for operational and legal protection:

- ✓ **Consultation records** — What the Client requested (style, texture, fade details, etc.), but linked to "Deleted Client" instead of name/email
- ✓ **Feedback** — Client's satisfaction ratings and notes, anonymized and linked to anonymous consultation
- ✓ **Barber delivery reports** — How the Barber executed (for training purposes)

### Why We Retain Anonymized Consultations

1. **Barber training:** Barbers reference past consultations to understand stylistic patterns and improve execution
2. **Dispute protection:** If a Client later disputes ("you gave me the wrong cut"), we have documented evidence of what they requested
3. **Legal compliance:** GDPR Article 3(1) allows retention for "legitimate business interests" (dispute resolution, operational records)
4. **Operational continuity:** Shop owner maintains consultation history without Client PII

### What Barbers & Owners See After Deletion

After deletion, Barbers and Owners see:
- Consultation record: "Anonymous Client — Fade, tight sides, 1 inch on top"
- Feedback: "Satisfied — Clean execution"
- No access to: Client's name, email, or AI clone

---

## Hard Deletion Timeline

Anonymized data is **fully purged after 90 days** for:
- Soft-deleted records
- Related logs
- All derivatives

**Reasoning:**
- 90 days covers standard dispute resolution windows
- Aligns with data minimization principle (GDPR Article 5)
- Protects Barber training data while respecting Client privacy

**Exception:** If a Client disputes during the 90-day period, retention extends until dispute is resolved.

---

## Faster Deletion Option

Clients who want hard deletion before 90 days can contact their Shop Owner directly. The Owner can request expedited deletion, which we process within 7 business days.

---

## AI Clone Deletion

AI clones are treated as **sensitive biometric data** and deleted immediately, before any anonymization:

1. Client requests deletion
2. We delete their AI clone from our systems within 24 hours
3. We request deletion from third-party AI services (within 48 hours)
4. Consultation record persists (anonymized), but has no associated clone

Clients can also delete their clone independently without deleting their full profile (e.g., "I want to keep my consultation history but delete my face data").

---

## Consent & Opt-In for Biometric Data

Because AI clones involve biometric processing (face/hair analysis), we handle them specially:

- **No default:** Clones are NOT generated unless Client explicitly consents
- **Clear notice:** Client sees "We will generate an AI clone using your photos. You can delete it anytime." before uploading
- **Separate deletion:** Clients can delete their clone without deleting other profile data

---

## Legal Basis for Retention

Under GDPR Article 6 (Lawfulness of Processing), Pleroma retains anonymized operational data under:

- **Legitimate interest** (Article 6(1)(f)): Dispute resolution, staff training, regulatory compliance
- **Legal obligation** (Article 6(1)(c)): Record-keeping for fraud prevention and shop liability

We balance Client privacy (right to be forgotten) with business necessity (dispute protection, training).

---

## Deletion Process (Internal)

### Step 1: Receive Deletion Request
- Record request date, Client email, request method (email / form / in-app)

### Step 2: Verify Identity
- Confirm email matches Client record
- (Optional) Require one-time verification link sent to email

### Step 3: Execute Deletion (24 hours)
- Delete personal data (email, name, clones, PIN)
- Anonymize consultation records
- Remove from all indexes and caches
- Log deletion with timestamp

### Step 4: Third-Party Cleanup (48 hours)
- Request AI service providers delete clones
- Confirm deletion certificates received

### Step 5: Soft-Delete Marker
- Mark record with `deleted_at` timestamp
- Retain soft-deleted records for 90 days
- Set hard-delete task for day 91

### Step 6: Document & Notify
- Send Client confirmation email: "Your profile has been deleted. Anonymized consultation records are retained for [reason]. They will be fully deleted on [date]."
- Log deletion in compliance audit trail

---

## Compliance Checklist

✅ **GDPR Article 17 (Right to Erasure)**
- Personal data deleted upon request
- Exceptions documented (legitimate business interest)

✅ **GDPR Article 5 (Data Minimization)**
- Personal data not retained longer than necessary
- Anonymized data retained only for stated purposes

✅ **GDPR Article 12–13 (Transparency)**
- Privacy Policy clearly explains deletion process
- Clients told what data is retained and why

✅ **GDPR Article 32 (Security)**
- Deleted data cannot be recovered by unauthorized parties
- Soft-deleted data is isolated and flagged

✅ **Lawful Basis**
- Legitimate business interest documented
- Client consent recorded for biometric data

---

## Questions?

For Client inquiries: Direct to Shop Owner  
For Shop Owner inquiries: Contact Pleroma support (email TBD)  
For data protection authority inquiries: See `privacy-policy.md`

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | July 2026 | Bryan | Initial policy |
