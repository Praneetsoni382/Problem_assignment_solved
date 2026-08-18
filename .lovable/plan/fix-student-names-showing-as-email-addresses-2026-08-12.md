# Fix student names showing as email addresses

## What's actually happening

I checked the live data. Of the four accounts, three store the real name correctly (e.g. "shubh rajpoot", "Shaad mohammad", "shivku singh"). Only `praneetsoni20480@gmail.com` shows the email as its name — that account was created without any registration details attached (no name, no role, no enrollment number saved with the sign-up), so the app fell back to using the email as the name.

So registration itself works; the gap is that when details are missing, the app silently invents a name from the email instead of asking, and there is no way to correct a wrong name afterwards.

## The fix

1. **Stop the silent email fallback.** When a verified user has no name/enrollment details saved, don't create a profile with the email as the name. Instead show a short "Complete your profile" screen asking for role, full name, and (for students) enrollment number, then create the profile from that.

2. **Let names be corrected.** Add a small "Edit profile" panel where a signed-in user can update their full name and enrollment number, so any existing wrong entry can be fixed by the user directly.

3. **Backfill the one bad row.** Update the affected student's profile with the correct name and enrollment number. I'll need those two values from you (see question below).

4. **Teacher roster stays as-is** — it will display the corrected names automatically once the row is fixed.

## Technical notes

- `src/lib/db.ts`: `ensureProfile()` returns a "needs details" signal instead of inserting a profile built from the email; add an `updateMyProfile()` helper (allowed by the existing `profiles_update_self` policy).
- New route `src/routes/complete-profile.tsx` (or an inline gated form on the authenticated layout) for the missing-details case; redirect there when no profile row exists.
- Profile edit panel rendered from the app shell / dashboard for both roles.
- Backfill is a single data update on `profiles` for the affected id.

## Open question

What is the correct full name and enrollment number for `praneetsoni20480@gmail.com`? If that account is meant to be a teacher rather than a student, tell me and I'll set the role accordingly.
