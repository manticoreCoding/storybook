# KAN-9: Add Basic Analytics

- **Status:** Approved
- **Last updated:** 2026-10-05

## Intent
As an author, I want to know how many total views each of my storybooks has had.

## Acceptance criteria
- GIVEN a story is public (`isPublic` is true) WHEN a reader loads the story THEN the system increments that story's total view count by one.
- GIVEN a reader has already viewed a story WHEN they load it again THEN the view count is incremented again.
- GIVEN a reader is reading a story WHEN they move between its pages THEN the view count is not incremented.
- GIVEN the story's owner, a shared editor, or an admin loads the story WHEN the page renders THEN the view count is not incremented.
- GIVEN the story's owner or an admin views the library page WHEN the page loads THEN the story's card shows its total view count.
- GIVEN any other user or a signed-out visitor views the library page WHEN the page loads THEN the story's card does not show a view count.

## Out of scope
- Per-page view counts
- Unique-reader or time-windowed ("new") view counts
- Counting views of private stories
- Story creation funnel and upload success rate analytics
- Automated test suite for `lib/stories.js` and the upload/crop/resize pipeline
- CI to run tests and build on PRs
