# KAN-1: Add real database for story metadata

## Intent
getAllStories() currently does a Blob list() + fetch-per-blob on every library load. Fine for a couple of stories, won't scale past a few dozen users.

- Introduce a real DB (Vercel Postgres or similar) for story metadata (title, description, owner, createdAt, page count)
- Keep Vercel Blob for images/cover only
- Migrate lib/stories.js off blob-based JSON storage for story data
- Write a one-time migration script for existing seed stories


## Acceptance criteria
- <observable behaviour the change must deliver>
- <another>

## Out of scope
- <what this change must not touch>
