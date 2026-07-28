# GDPR-compliant data deletion: anonymize & soft-delete, not hard-delete

When a Client requests deletion of their profile (right to be forgotten), we must comply with GDPR. We considered (a) hard-deleting everything (simplest, but loses valuable training data), (b) keeping everything (violates GDPR), and (c) deleting personal data but anonymizing operational records for training and dispute protection.

We chose option (c): **immediate personal data deletion + 90-day anonymized retention.**

**Trade-offs:**

**Why anonymization, not hard-delete:**
- **Training signal preserved**: Barbers learn from past consultations without knowing Client identity. "Fade, tight sides, 1 inch on top" helps future execution even if Client is gone.
- **Dispute protection**: If Client later claims "you messed up," we have evidence of what they requested — proves the Barber delivered as requested or shows miscommunication.
- **Legal defensibility**: Shop owner can reference consultation history in disputes without violating GDPR (data is anonymized).
- **GDPR-compliant**: Legitimate business interest (dispute resolution, staff training) justifies retention of anonymized data per Article 6(1)(f).

**Why not hard-delete:**
- Loses training value
- Exposes Shop to liability ("I never asked for that cut" — no proof either way)
- Violates operational best practices in small-team settings

**Why not keep everything:**
- Violates GDPR Article 17 (right to be forgotten)
- Creates liability (Client can claim we kept personal data illegally)
- Damages trust

**Why 90-day retention (not indefinite):**
- Covers standard dispute resolution window (most disputes surface within weeks)
- Balances business need against data minimization principle
- If dispute surfaces after 90 days, it's likely bad-faith or outside reasonable expectation
- Clients can request expedited deletion before 90 days if they want faster hard-delete

**Deletion process:**

1. **Immediate (within 24 hours):**
   - Delete email, name, AI clones, PIN
   - All personal data gone

2. **Anonymize (concurrent):**
   - Consultation records linked to "Deleted Client" instead of name
   - Feedback retained but anonymized
   - Barber delivery report kept for training

3. **Soft-delete & retention (90 days):**
   - Mark records with `deleted_at` timestamp
   - Retain in isolated table/partition
   - Log every access attempt

4. **Hard-delete (day 91):**
   - Permanently purge anonymized records
   - No recovery possible

**Security & compliance:**

- Anonymized data is isolated (cannot be re-identified)
- Soft-deleted data is excluded from all Client-facing queries
- Only Admins can access soft-deleted records (and only for audit/dispute)
- Deletion is logged in compliance audit trail
- Third-party AI services notified to delete clones (verified with certificates)

**Legal basis (GDPR Article 6):**
- **Legitimate business interest**: Dispute resolution, staff training, regulatory compliance
- **Legal obligation**: Shop liability records

**Transparency (GDPR Articles 12–14):**
- Privacy policy explicitly states what is deleted vs anonymized and why
- Clients told retention timeline (90 days) before deletion
- Clients can request expedited deletion anytime
