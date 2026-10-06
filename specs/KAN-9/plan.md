# KAN-9: Plan

- **Status:** Done
- **Spec:** [spec.md](spec.md)

## Approach

- **Storage:** keep view counts in their own record per story (`views/<id>.json` in Blob in production, `data/views/<id>.json` locally), not in the story JSON
  - `saveStory` writes the whole story object sent by the edit form, so a count inside the story JSON would be overwritten by any edit
  - A missing record means 0 views
- **Counting:** the reader calls a new `POST /api/stories/[id]/view` endpoint once when the story mounts
  - The endpoint loads the story and the actor and increments only if `story.isPublic` is true and `canManage(story, actor)` is false (this excludes the owner, shared editors and admins)
  - A client-side call is used instead of counting during the server render, so link prefetching and metadata generation cannot add views
  - Every load counts, so there is no per-reader deduplication
- **Display:** on the library page, attach `viewCount` to each story only when the actor is the owner or an admin
  - `BookCard` is a client component, so the count must not be sent in its props for other viewers
  - `BookCard` shows the count when `viewCount` is defined
- **Cleanup:** `deleteStory` also removes the story's view record

## Files touched

| File | Change |
| --- | --- |
| `lib/views.js` | New. `getViewCount(id)`, `getViewCounts(ids)`, `incrementViewCount(id)` and `deleteViewCount(id)`, with Blob and local filesystem branches matching `lib/stories.js` |
| `lib/authz.js` | Add `canSeeViews(story, actor)`, which is true for the owner or an admin |
| `app/api/stories/[id]/view/route.js` | New `POST` handler that applies the counting rules |
| `components/StoryReader.jsx` | Call the view endpoint once on mount |
| `app/page.jsx` | Load counts for stories where `canSeeViews` is true and attach them as `viewCount` |
| `components/LibraryGrid.jsx` | Pass `viewCount` through to `BookCard` |
| `components/BookCard.jsx` | Render the view count |
| `lib/stories.js` | Call `deleteViewCount` from `deleteStory` |
| `.gitignore` | Ignore `data/views/` |

## Data / schema changes

- New Blob prefix `views/` holding `{ "count": <number> }` per story
- No change to the story JSON shape or the auth rules
- No migration: existing stories start at 0

## Risks

- **Lost increments:** Blob has no atomic increment, so the read-modify-write can drop a view when two reads happen at the same moment. This is acceptable at current traffic and goes away once KAN-1 adds a real database.
- **Blob cost and latency:** each counted view is one list, one fetch and one put. The library page adds one list plus one fetch per story the actor can see views for.
- **Dev double count:** React Strict Mode runs effects twice in development. A ref guard keeps it to one call per mount.
- **Inflated counts:** refreshes and bots count as views. This matches the spec's rule that repeat views count.

## Testing

There is no automated test suite (out of scope), so each criterion is checked by hand in `npm run dev`, followed by `npm run lint` and `npm run build`.

| Acceptance criterion | Check |
| --- | --- |
| A public story load by a reader increments the count | Open a public story signed out and as another user, then confirm `data/views/<id>.json` goes up by 1 each time |
| Repeat views count | Reload the same story, then confirm the count goes up again |
| Page turns do not count | Open a public story as a reader, move through several pages, then confirm the count went up by 1 only |
| Owner, shared editor and admin loads do not count | Open the story as each of them, then confirm the count does not change |
| Private stories are not counted | Open a private story as a manager, then confirm no view record is written |
| Owner and admin see the count on the card | Load the library as the owner and as an admin, then confirm the count shows |
| Others do not see the count | Load the library signed out, as a shared editor and as another user, then confirm there is no count on the card and no `viewCount` in the page payload |
