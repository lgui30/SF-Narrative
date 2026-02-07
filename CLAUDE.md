# Claude Code Instructions (sf-weekly-news-digest)

Claude Code does not automatically execute tasks on startup. It reads this
file for context, then waits for a user prompt.

## IMPORTANT: First Run Setup (pmkit)

This project was just initialized with pmkit.

When the user says "init docs", "complete setup", or "finish pmkit setup",
you should:
1. Analyze the codebase thoroughly
2. Update `pm/docs/architecture.md` with real component descriptions
3. Update `pm/docs/tech-stack.md` with actual versions from package.json
4. Remove this section when done

Suggested workflow:
- npx pmkit init
- claude
- You: init docs  (analyzes codebase and populates pm/ documentation)

## About

AI-powered weekly news digest for San Francisco

## Quick Reference

```bash
# Development
npm run dev

# Build
npm run build

# Lint
npm run lint
```

## Project Structure

```
sf-weekly-news-digest/
├── components/
├── lib/
├── public/
├── pm/               # pmkit documentation
│   ├── prds/         # Product requirements (markform)
│   ├── docs/         # Technical documentation
│   ├── changelog/    # Living changelog
│   └── sessions/     # Work session memory
└── ...
```

## Tech Stack

**Languages:** TypeScript
**Frameworks:** React, Next.js, Prisma
**Package Manager:** npm

## pm Workflow

This project uses pmkit for documentation:

- `pm/prds/` - Product requirements documents (markform structured)
- `pm/docs/` - Architecture and technical documentation
- `pm/changelog/CHANGELOG.md` - Living record of what changed and why
- `pm/sessions/` - Work session memory
- `pm/onboarding.md` - Project context for Claude (markform structured)
- `pm/preferences.md` - User collaboration preferences

When working on features:

1. Check `pm/prds/` for feature requirements
2. Reference `pm/docs/architecture.md` for system design
3. Update changelog after meaningful changes

## Changelog Guidelines

Update `pm/changelog/CHANGELOG.md` when:
- A feature is added or significantly changed
- A bug is fixed
- Architecture decisions are made
- Anything the user would want to remember later

Format:
```markdown
## YYYY-MM-DD

### Short title
What changed in plain english.

_Why: The reason behind this change._
```

Keep entries concise. Focus on what and why, not how.

## Session Awareness

This project uses session memory to maintain context across conversations.

**At session start:**
1. Check if `pm/sessions/_active.md` exists
2. If yes, read it to understand current work context
3. Summarize the active session goal and progress

**During work:**
- Update progress checkboxes in `_active.md` as tasks complete
- Log key decisions made during the session
- Note any files modified

**When user asks "what were we working on?":**
- Read `pm/sessions/_active.md` and summarize
- List incomplete tasks
- Suggest next steps

## Key Dependencies

- @prisma/client
- next
- playwright
- prisma
- react
- zod

## Development Notes

<!-- Add project-specific notes here -->

- Check code style: `npm run lint`
