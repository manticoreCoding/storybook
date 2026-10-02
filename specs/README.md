# Specs

Spec-driven development. Every feature or fix starts from a Jira ticket in the `KAN` project and gets a spec here before any code is written.

## Layout

```
specs/
  _template/            # copy this for each new ticket
    spec.md             # what and why
    plan.md             # how
    tasks.md            # ordered implementation checklist
  KAN-123-short-slug/   # one folder per Jira ticket
```

## Flow

1. **Spec**
   - Copy `_template/` to `specs/KAN-xxx-short-slug/`
   - Fill in `spec.md` from the Jira ticket
   - Review and set status to `Approved`
2. **Branch**
   - Create a branch named `KAN-xxx-short-slug` from `main`
   - All work for the ticket, including spec edits after approval, happens on this branch
3. **Plan**
   - Fill in `plan.md` and `tasks.md` against the current codebase
   - Review before implementation starts
4. **Implement**
   - Work through `tasks.md` in order, checking off items as they land
   - Prefix commit messages with `KAN-xxx:`
   - Set status to `In Progress`
5. **Done**
   - All acceptance criteria in `spec.md` are met
   - Set status to `Done` and merge the branch

## Status values

`Draft` > `Approved` > `In Progress` > `Done`

Each file carries its status in the header so the folder shows where every ticket stands.

## Rules

- No code without an approved spec
- If scope changes during implementation, update `spec.md` first, then `plan.md` and `tasks.md`
- Anything out of scope goes in the spec's "Out of scope" section or a new Jira ticket, not into the current branch
