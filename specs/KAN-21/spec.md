# KAN-21: To centrally track latest version of an app, save date and version to Notion

## Intent
Track the latest version and release date of the storybook app by automatically saving this information to Notion for central visibility.

## Acceptance criteria
- Triggering the version tracking action sends the current app version string and release date to the designated Notion database.
- The Notion database entry includes distinct properties for both the app version and the release date.
- If the Notion API request fails, an error is logged in the application console.

## Out of scope
- Building a user interface screen in the storybook app to display Notion release history.
- Automating the release version bump process via CI/CD pipelines.
