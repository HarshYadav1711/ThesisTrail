# Submission checklist — ThesisTrail

Mark items only when verified. Do **not** check external items until confirmed.

## Deliverables

- [x] Thinking Note Markdown (`docs/submission/THINKING_NOTE.md`)
- [x] Thinking Note PDF ≤ 2 A4 pages (`docs/submission/THINKING_NOTE.pdf`) — verified 2 pages + visual QA
- [x] AI Usage Note Markdown (`docs/submission/AI_USAGE_NOTE.md`)
- [x] AI Usage Note PDF exactly 1 A4 page (`docs/submission/AI_USAGE_NOTE.pdf`) — verified 1 page + visual QA
- [x] Demo script (`docs/submission/DEMO_SCRIPT.md`)
- [ ] Demo video public URL (2–3 min, no sign-in) — **pending user upload or explicit deferral**
- [x] Genuine ASK screenshot (`docs/assets/thesistrail-ask.png`)
- [x] Genuine LEARN screenshot (`docs/assets/thesistrail-learn.png`)
- [x] Reviewer-first README with real links only (live/video omitted until available)

## Repository and branch

- [x] Public GitHub repository: https://github.com/HarshYadav1711/ThesisTrail
- [ ] Default branch `main` contains final submission commit
- [ ] README relative links resolve on GitHub (after push of submission commit)

## Live deployment

- [x] Vercel Hobby project linked / deployed (personal assessment use) — `harshs-projects-fc8c193d/thesistrail`
- [x] Public HTTPS live application URL in README — https://thesistrail.vercel.app
- [x] `GET /` returns 200 with correct title
- [x] `POST /api/research/interpret` works without provider env (fallback)
- [x] `POST /api/research/run` returns locked metrics / checksum
- [x] Full browser ASK→LEARN on production
- [x] No AI provider env configured on public deploy

## Local quality gates

- [x] `npm ci` succeeds
- [x] `npm run data:verify` passes
- [x] `npm run lint` / `typecheck` / `test:run` / `build` / `validate` pass
- [x] `npm audit --omit=dev` clean (or documented)

## Product integrity

- [x] Locked negative result retained (`not_supported`, exact `primaryDelta`)
- [x] Dataset checksum unchanged
- [x] No secrets / `.env` credentials in repo
- [x] No placeholder / example.com / fake URLs in reviewer docs
- [x] Keyboard / mobile checks done (Phase 6 + spot-check)

## Assignment form (manual)

- [ ] Repository URL ready
- [ ] Live app URL ready
- [ ] Demo video URL ready (or deferred with README link omitted)
- [ ] Thinking Note + AI Usage Note attached as required by the form
- [x] Candidate name: Harsh Yadav
