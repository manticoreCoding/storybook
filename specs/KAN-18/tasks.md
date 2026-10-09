# KAN-18: Tasks

- **Status:** Approved
- **Plan:** [plan.md](plan.md)

Ordered checklist. Check off each item as it lands.

- [x] Create branch `KAN-18` from `main`
- [ ] Add `data/authors/` to `.gitignore`
- [ ] Create `lib/authors.js` with `getAuthors`, `addAuthor`, `renameAuthor` and `removeAuthor` (Blob and local branches, trimming, blank and duplicate checks)
- [ ] Add `GET` and `POST` in `app/api/authors/route.js` (401 signed out, 403 non-admin, 400 validation)
- [ ] Add `PATCH` and `DELETE` in `app/api/authors/[id]/route.js` (same checks, plus 404 for an unknown id)
- [ ] Create `components/AuthorList.jsx` with add, inline rename, remove and error message
- [ ] Create `app/admin/authors/page.jsx` that redirects non-admins to `/` and renders `AuthorList` with the admin's authors
- [ ] Add an admin-only "Authors" link to `/admin/authors` in the header in `app/page.jsx`
- [ ] Run `npm run lint` and `npm run build`
- [ ] Verify every acceptance criterion in [spec.md](spec.md) using the checks in [plan.md](plan.md)
- [ ] Set spec status to `Done`
