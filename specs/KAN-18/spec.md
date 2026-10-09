# KAN-18: Admins can add author(s) to their profile

- **Status:** Approved
- **Last updated:** 2026-10-09

## Intent
As an admin, I want to keep a list of the kids who write our stories on an Authors page, so their names are saved in one place and ready to credit on stories.

The author list is content the admin manages, not part of the admin's own profile, personal preferences or identity.

## Acceptance criteria
- GIVEN a signed-in admin WHEN they open the Authors page THEN they see their list of authors (empty if none have been added).
- GIVEN a signed-in admin is on the Authors page WHEN they add an author name and save THEN the name appears in their author list and is still there after a page reload.
- GIVEN a signed-in admin has one or more authors WHEN they add another THEN all authors are kept (an admin can have multiple authors).
- GIVEN a signed-in admin WHEN they try to add a blank name, or a name already in their list (ignoring case and surrounding spaces) THEN the name is not added and they see a message explaining why.
- GIVEN a signed-in admin has an author in their list WHEN they edit that author's name and save THEN the updated name is shown in the list.
- GIVEN a signed-in admin has an author in their list WHEN they remove that author THEN the name no longer appears in the list.
- GIVEN a signed-in user who is not an admin, or a signed-out visitor WHEN they try to open the Authors page or call its API THEN they cannot view or change any author list.
- GIVEN two admins WHEN each manages their author list THEN each only sees and changes their own list.

## Out of scope
- Crediting authors on stories (picking authors when editing a story)
- Showing author names on story cards or the reader page; when added in a follow-up ticket, names are visible to everyone who can see the story
- Author profiles beyond a name (photo, age, bio)
- Author management for non-admin users
- Any change to the admin's own profile, preferences or account settings
