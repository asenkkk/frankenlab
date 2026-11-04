# Steering — Product

FrankenLab is a Kiroween 2026 (Frankenstein category) entry: four security tools
stitched into one client-side web app, dressed in a polished Halloween theme.

Product rules for any generated or edited code:
- The user is a solo security practitioner; tools must be genuinely functional,
  never mock/demo data passed off as real results.
- Privacy is the headline feature: nothing pasted into the app leaves the
  browser except calls the user explicitly triggers. Say so in the UI.
- Honesty over polish in failure cases: explain CORS and RPC errors plainly;
  never claim a target is down or a token is safe beyond what was checked.
- Tone: playful-spooky in headings, precise and plain in results and errors.
- Every tool must work standalone if the others fail.
