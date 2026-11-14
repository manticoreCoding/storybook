# KAN-14: Garbage collection: schedule job to delete stories and their images

## Intent
A scheduled job is needed for the storybook app to permanently delete stories and their images after their status changes to delete.

## Acceptance criteria
- A scheduled background job runs periodically to check for stories marked with the delete status.
- Stories and their associated images that have reached the deletion grace period are permanently removed from the system.
- Stories that are not marked with the delete status are left untouched by the scheduled job.

## Out of scope
- Option to force delete immediately.
- UI changes for the undelete button.
