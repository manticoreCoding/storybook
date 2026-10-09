# KAN-17: Add author to each story card

- **Status:** Draft
- **Last updated:** 2026-10-08

## Intent
As a reader, I want to see who wrote each story on its card, so I know which kid wrote it.

## Dependencies
- KAN-18: authors are picked from the admin's author list added in that ticket

## Acceptance criteria
- GIVEN an admin is editing a story WHEN they open the edit page THEN they can pick one or more authors from their author list.
- GIVEN an admin has picked authors for a story and saved WHEN the story is reloaded THEN the same authors are still selected.
- GIVEN an admin is editing a story with authors WHEN they unselect all authors and save THEN the story has no authors.
- GIVEN a story has one or more authors WHEN anyone who can see the story views the library page THEN the story's card shows "By" followed by the author names.
- GIVEN a story has no authors WHEN the library page loads THEN the story's card shows no author line.
- GIVEN an author on a story is renamed in the admin's author list WHEN the library page loads THEN the card shows the new name.
- GIVEN an author on a story is removed from the admin's author list WHEN the library page loads THEN that name no longer appears on the card.
- GIVEN a signed-in user who is not an admin WHEN they edit a story they own or share THEN they cannot change its authors.

## Out of scope
- Showing authors on the reader page
- Adding or editing authors from the story edit page (managed on the profile page in KAN-18)
- Filtering or searching stories by author
- Author pages or profiles
