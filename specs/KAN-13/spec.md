# KAN-13: Allow creation of groups with up to 30 users

## Intent
Allows the storybook admin to create groups and add up to 30 users via email on a dedicated page, showing an error message if the limit is exceeded.

## Acceptance criteria
- Only a user with the storybook admin role can create a new group.
- There is a new page dedicated to adding members to a group using their email addresses.
- A group can successfully contain up to 30 users.
- When the admin attempts to add a 31st user to a group, an error message stating that there are too many users is displayed.

## Out of scope
- Control on how storybook access is managed with groups.
- Group deletion or editing group details beyond adding members.
