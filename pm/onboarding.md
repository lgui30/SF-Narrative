---
markform:
  spec: MF/0.1
  title: Project Onboarding
  description: Quick context for Claude to understand this project
  roles:
    - user
    - agent
---

<!-- form id="onboarding" -->

# Project Onboarding

Fill this out to give Claude context about your project and how you work.

---

<!-- group id="project" -->

## Project Context

<!-- field kind="string" id="project_name" label="Project name" role="user" -->
<!-- /field -->

<!-- field kind="text" id="project_description" label="What does this project do? (1-2 sentences)" role="user" -->
<!-- /field -->

<!-- field kind="string" id="primary_language" label="Primary language/framework" role="user" -->
<!-- /field -->

<!-- field kind="text" id="key_directories" label="Key directories to know about" role="user" -->
<!-- /field -->

<!-- /group -->

---

<!-- group id="workflow" -->

## How You Work

<!-- field kind="enum" id="deploy_method" label="How do you deploy?" role="user" options="Vercel,Netlify,Railway,Manual,Other" -->
<!-- /field -->

<!-- field kind="enum" id="commit_style" label="Commit style" role="user" options="Conventional commits,Freeform,Squash and merge,Other" -->
<!-- /field -->

<!-- field kind="text" id="testing_approach" label="Testing approach (if any)" role="user" -->
<!-- /field -->

<!-- /group -->

---

<!-- group id="preferences" -->

## Collaboration Preferences

<!-- field kind="text" id="communication_style" label="How should Claude communicate? (terse, detailed, etc.)" role="user" -->
<!-- /field -->

<!-- field kind="text" id="autonomy_level" label="How autonomous should Claude be? (ask first, just do it, etc.)" role="user" -->
<!-- /field -->

<!-- field kind="text" id="pet_peeves" label="Things Claude should never do" role="user" -->
<!-- /field -->

<!-- /group -->

---

<!-- group id="context" -->

## Current State

<!-- field kind="text" id="current_focus" label="What are you currently working on?" role="user" -->
<!-- /field -->

<!-- field kind="text" id="known_issues" label="Known issues or tech debt" role="user" -->
<!-- /field -->

<!-- /group -->

<!-- /form -->
