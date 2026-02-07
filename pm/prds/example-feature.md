---
markform:
  spec: MF/0.1
  title: "Example Feature"
  created: 2026-01-25
  roles:
    - user
    - agent
---

<!-- form id="prd" -->

# Example Feature

<!-- group id="meta" -->

<!-- field kind="enum" id="status" label="Status" role="user" options="Draft,In Review,Approved,In Progress,Complete,Abandoned" -->
```value
Draft
```
<!-- /field -->

<!-- field kind="string" id="author" label="Author" role="user" -->
<!-- /field -->

<!-- /group -->

---

<!-- group id="problem" -->

## Problem

<!-- field kind="text" id="problem_statement" label="What problem does this solve? Who has it?" role="user" -->
<!-- /field -->

<!-- field kind="text" id="why_now" label="Why solve this now?" role="user" -->
<!-- /field -->

<!-- /group -->

---

<!-- group id="solution" -->

## Solution

<!-- field kind="text" id="overview" label="What are we building? (1-2 sentences)" role="user" -->
<!-- /field -->

<!-- field kind="text" id="how_it_works" label="How does it work?" role="user" -->
<!-- /field -->

<!-- /group -->

---

<!-- group id="scope" -->

## Scope

<!-- field kind="text" id="goals" label="Goals (what's in scope)" role="user" -->
<!-- /field -->

<!-- field kind="text" id="non_goals" label="Non-goals (explicitly out of scope)" role="user" -->
<!-- /field -->

<!-- /group -->

---

<!-- group id="details" -->

## Details

<!-- field kind="text" id="user_flow" label="User flow (step by step)" role="agent" -->
<!-- /field -->

<!-- field kind="text" id="edge_cases" label="Edge cases to handle" role="agent" -->
<!-- /field -->

<!-- field kind="text" id="technical_notes" label="Technical approach" role="agent" -->
<!-- /field -->

<!-- /group -->

---

<!-- group id="tracking" -->

## Tracking

<!-- field kind="text" id="success_metrics" label="How do we know this worked?" role="user" -->
<!-- /field -->

<!-- field kind="text" id="open_questions" label="Open questions" role="user" -->
<!-- /field -->

<!-- /group -->

<!-- /form -->
