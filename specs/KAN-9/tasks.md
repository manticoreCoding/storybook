# KAN-9: Tasks

- **Status:** Done
- **Plan:** [plan.md](plan.md)

Ordered checklist. Check off each item as it lands.

- [x] Create branch `KAN-9` from `main`
- [x] Add `data/views/` to `.gitignore`
- [x] Create `lib/views.js` with `getViewCount`, `getViewCounts`, `incrementViewCount` and `deleteViewCount` (Blob and local branches)
- [x] Add `canSeeViews(story, actor)` to `lib/authz.js`
- [x] Add `POST /api/stories/[id]/view` that increments only for public stories viewed by non-managers
- [x] Call the view endpoint once on mount in `components/StoryReader.jsx`
- [x] Remove the view record in `deleteStory` in `lib/stories.js`
- [x] Attach `viewCount` in `app/page.jsx` for stories where `canSeeViews` is true
- [x] Render `viewCount` in `components/BookCard.jsx` (`LibraryGrid` passes it through on the story object, so no change needed)
- [x] Run `npm run lint` and `npm run build` (build passes; lint has 1 pre-existing error in `ImageEditorModal.jsx`, outside this ticket)
- [x] Verify every acceptance criterion in [spec.md](spec.md) using the checks in [plan.md](plan.md)
- [x] Set spec status to `Done`
