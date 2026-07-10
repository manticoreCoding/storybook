# Storybook — Product Roadmap / TODO

Product review from 2026-07-03: this is a feature-complete personal tool
(single shared library, no auth) but not yet a marketable product. Gaps and
priorities below, ordered by blocking-ness rather than by when they were found.

## 1. Auth + per-user story ownership — BLOCKING
`/admin/edit/[id]` currently has zero access control. Anyone with a story URL
can edit or delete it. Nothing else on this list matters until this exists.

- [x] Add authentication (Clerk) — verified end-to-end in a live browser 2026-07-10
- [x] Add a `userId`/owner field to the story schema (`ownerId` + `editorIds`)
- [x] Scope `getAllStories`/`getStory`/`saveStory`/`deleteStory` (lib/stories.js) to the current user
- [x] Gate `/admin` and `/admin/edit/[id]` behind login
- [x] Decide what happens to the two existing seed stories — assigned to the owner's account in local dev data
- [x] Clerk deployed to production (the production site) and all 4 pre-existing stories in the production Vercel Blob store (`dragon-park`, `magic-snowman`, `stella-s-drawings`, `the-little-cloud`) backfilled with `ownerId` on 2026-07-10

## 2. Real database for story metadata
`getAllStories()` currently does a Blob `list()` + fetch-per-blob on every
library load. Fine for a couple of stories, won't scale past a few dozen
users.

- [ ] Introduce a real DB (Vercel Postgres or similar) for story metadata (title, description, owner, createdAt, page count)
- [ ] Keep Vercel Blob for images/cover only
- [ ] Migrate `lib/stories.js` off blob-based JSON storage for story data
- [ ] Write a one-time migration script for existing seed stories

## 3. One killer differentiator
Right now it's a manual page-by-page photo+caption editor — not clearly
different from a shared photo album with captions. Needs one strong reason
to pay.

- [ ] Decide: print-on-demand fulfillment (e.g. Lulu xPress API) vs. AI-assisted story generation vs. AI illustration generation
- [ ] Recommendation from review: print-on-demand first — a physical book in the mail is a stronger emotional payoff and harder for a free tool to replicate
- [ ] Scope a v1 of the chosen feature separately once picked

## 4. Monetization
No plans, no limits, no billing today. Depends on (1) auth existing first.

- [ ] Define tiers (e.g. free: 1 story; paid: unlimited stories + print credits)
- [ ] Add billing (Stripe) once tiers are defined
- [ ] Add usage limits/enforcement in the save/upload flow

## 5. Legal / privacy
App stores photos of children. Needs attention before any public users
beyond your own family.

- [ ] Write a privacy policy + terms of service
- [ ] If marketed broadly to families: review COPPA/GDPR-K requirements (data retention, parental consent, right to delete)
- [ ] Add a way for a user to fully delete their account + all associated images/data

## 6. Sharing / collaboration
- [ ] Read-only share link per story (e.g. for grandparents)
- [ ] Multi-editor support per story (e.g. both parents contributing)
- [x] Fix UX gap in "Share to Manage" (`components/StoryForm.jsx`): "+ Add"/remove now save immediately via their own API call instead of waiting for "Save Changes". Collaborators also display as name (or email if no name) instead of a raw user ID.

## 7. Quality/observability groundwork
- [ ] Add basic analytics (page views, story creation funnel, upload success rate)
- [ ] Add an automated test suite (currently none) — at minimum cover lib/stories.js and the upload/crop/resize pipeline
- [ ] Add CI to run tests + build on PRs

## 8. Admin capabilities & groups
- [ ] Allow admin to delete stories — `deleteStory` in `lib/stories.js` already enforces owner/admin authorization, but there's no `DELETE` route in `app/api/stories/route.js` and no delete button anywhere in the UI. Needs both.
- [ ] Allow admin to publish stories to everyone (public visibility beyond owner/editors)
- [ ] Allow admin to publish stories to everyone in their group (depends on groups existing, see below)
- [ ] Allow creation of groups with up to 50 users — new data model needed (group entity, membership, size cap); decide how this relates to `ownerId`/`editorIds` on stories

---

## Recommended next 3 (per 2026-07-03 review)
1. Auth + per-user story ownership
2. Print-on-demand fulfillment as the differentiator
3. Real database for story metadata
