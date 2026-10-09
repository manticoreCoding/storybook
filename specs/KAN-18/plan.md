# KAN-18: Plan

- **Status:** Approved
- **Spec:** [spec.md](spec.md)

## Approach

- **Ownership:** the author list is content the admin manages, not part of their Clerk profile, preferences or identity
  - Nothing is stored on the Clerk user (no `publicMetadata` or `unsafeMetadata`). The Clerk user id is only used as the key that says which admin manages the list
  - The page lives under `/admin/authors`, not under a profile route
- **Storage:** keep each admin's author list in its own record keyed by their Clerk user id (`authors/<userId>.json` in Blob in production, `data/authors/<userId>.json` locally), following the pattern in `lib/views.js`
  - Shape: `{ "authors": [{ "id": "<uuid>", "name": "Maya" }] }`
  - Each author gets a stable `id` from `crypto.randomUUID()`, so KAN-17 can reference authors by id and pick up renames and removals
  - A missing record means an empty list
- **Validation:** done in `lib/authors.js` so the API cannot bypass it
  - Names are trimmed before saving
  - A blank name is rejected with "Author name can't be blank"
  - A name that matches another author in the same list (case-insensitive, after trimming) is rejected with "<name> is already in your author list". On a rename, the author being renamed is excluded from the check
- **API:** admin-only route handlers, always scoped to `actor.userId` so an admin can only reach their own list
  - `GET /api/authors` lists authors
  - `POST /api/authors` with `{ name }` adds an author
  - `PATCH /api/authors/[id]` with `{ name }` renames an author
  - `DELETE /api/authors/[id]` removes an author
  - Signed out returns 401, signed in but not an admin returns 403, a validation error returns 400, and an unknown author id returns 404
- **Page:** `app/admin/authors/page.jsx`, a server component titled "Authors"
  - `/admin(.*)` is already protected in `proxy.js`, so signed-out visitors are sent to sign in
  - A signed-in non-admin is redirected to `/` with `redirect()`. `forbidden()` is experimental in Next 16 and needs `authInterrupts`, so it is not used
  - The page loads the admin's authors and passes them to a client component, `components/AuthorList.jsx`
- **AuthorList:** add form, list with inline edit and remove, and an error message area. It calls the API and updates its list from the response
- **Navigation:** add an "Authors" link to the library header, shown only when `actor.isAdmin`

## Files touched

| File | Change |
| --- | --- |
| `lib/authors.js` | New. `getAuthors(userId)`, `addAuthor(userId, name)`, `renameAuthor(userId, id, name)` and `removeAuthor(userId, id)`, with Blob and local filesystem branches and validation |
| `app/api/authors/route.js` | New. `GET` and `POST` |
| `app/api/authors/[id]/route.js` | New. `PATCH` and `DELETE` |
| `app/admin/authors/page.jsx` | New. Admin-only Authors page |
| `components/AuthorList.jsx` | New. Client component to add, rename and remove authors |
| `app/page.jsx` | Add an admin-only "Authors" link to `/admin/authors` in the header |
| `.gitignore` | Ignore `data/authors/` |

## Data / schema changes

- New Blob prefix `authors/` holding one record per admin
- No change to the story JSON shape
- No change to the Clerk user record
- No change to auth rules: admin status still comes from `ADMIN_EMAILS` through `getActor()`
- No migration: every admin starts with an empty list

## Risks

- **Lost writes:** Blob has no transactions, so two saves to the same list at the same moment can overwrite each other. This is unlikely for a single admin's list and goes away with KAN-1.
- **Losing admin status:** if an email is removed from `ADMIN_EMAILS`, that user's author record stays in storage but can no longer be reached. This is acceptable, and the list comes back if they are made an admin again.
- **KAN-17 coupling:** the `id` field is what KAN-17 will store on stories. Changing the record shape later would need a migration.

## Testing

There is no automated test suite, so each criterion is checked by hand in `npm run dev`, followed by `npm run lint` and `npm run build`.

| Acceptance criterion | Check |
| --- | --- |
| Admin sees their list, empty if none | Open `/admin/authors` as an admin with no record, then confirm the empty state shows |
| Add persists across reload | Add a name, reload, then confirm it is listed and `data/authors/<userId>.json` contains it |
| Multiple authors are kept | Add a second and third name, then confirm all are listed after reload |
| Blank and duplicate names are rejected with a message | Try `"   "`, then `" maya "` when `Maya` exists, then confirm nothing is added and the message shows. Repeat for a rename to an existing name |
| Edit updates the name | Rename an author, save, reload, then confirm the new name shows with the same `id` in the record |
| Remove deletes the name | Remove an author, reload, then confirm it is gone |
| Non-admins and signed-out visitors are blocked | Open `/admin/authors` signed out (sent to sign-in) and as a non-admin (redirected to `/`). Call each API method in both states, then confirm 401 and 403 with no file changes |
| Each admin sees only their own list | Sign in as two admins, add different names, then confirm each sees only their own. Call `PATCH` and `DELETE` with the other admin's author id, then confirm 404 and no change |
