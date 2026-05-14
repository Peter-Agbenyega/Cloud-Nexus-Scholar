# Cloud Nexus Scholar

Cloud Nexus Scholar is a Next.js academic workspace for UMGC coursework. The current version adds an assignment intelligence workflow so the app can parse assignment requirements, generate a stronger draft, score submission readiness, and track what is still pending.

## Academic Agent Workflow

When an assignment prompt is pasted into the assignment detail view, the app now follows this flow:

1. `Assignment Intelligence Engine`
   - Parses the prompt into a structured assignment profile.
   - Extracts course, unit, type, word count, peer reply rules, due dates, APA/citation requirements, deliverables, rubric clues, and practical evidence hints.
   - Core function: `parseAssignmentPrompt()` in [lib/assignment-agent.ts](/Users/peterchristianagbenyega/Desktop/Cloud Projects/Cloud-Nexus-Scholar/lib/assignment-agent.ts)

2. `Human Academic Writing Engine`
   - Builds a generation prompt that keeps the writing plain, student-like, and aligned to the assignment constraints.
   - Supports `initial_post`, `full_assignment`, `outline`, `rubric_cleanup`, `apa_reference_cleanup`, and `submission_comment`.
   - Client calls the API route at [app/api/assignment-agent/route.ts](/Users/peterchristianagbenyega/Desktop/Cloud Projects/Cloud-Nexus-Scholar/app/api/assignment-agent/route.ts)

3. `Submission Compliance Guard`
   - Checks word count, in-text citations, APA references, prompt coverage, deliverables, rubric alignment, generic writing signals, peer-reply readiness, and practical evidence requirements.
   - Returns a structured compliance report plus the next action.
   - Core functions: `runComplianceCheck()`, `calculateReadinessScore()`, and `updateAssignmentStatus()` in [lib/assignment-agent.ts](/Users/peterchristianagbenyega/Desktop/Cloud Projects/Cloud-Nexus-Scholar/lib/assignment-agent.ts)

## Assignment Data Model

Assignment records now persist in local storage through [lib/assignment-store.ts](/Users/peterchristianagbenyega/Desktop/Cloud Projects/Cloud-Nexus-Scholar/lib/assignment-store.ts).

Each record tracks:

- Assignment metadata
- Parsed assignment profile
- Final draft
- Submission comment
- Compliance report
- Missing items
- Warnings
- Readiness score
- Status
- Updated timestamp

The local store seeds itself from the existing syllabus data, then layers user edits and compliance state on top.

## UI Changes

### Dashboard

The home page now includes an academic submission dashboard that shows:

- Submitted vs not submitted counts
- Peer replies still needed
- Ready-now count
- Assignment cards with due dates, citation flags, readiness scores, and required action

### Assignment Detail View

The assignment workspace now includes:

- Prompt import and parsing
- Prompt summary
- Deliverables checklist
- Rubric checklist
- Draft generator
- Compliance panel
- Submission comment generator
- Manual submit-state control

### Unit Assignment Cards

Each assignment card now shows:

- Status signal
- Readiness score
- Word-count requirement
- Citation requirement
- First missing item or warning

## Reusable Functions

Implemented reusable functions requested for the next version:

- `parseAssignmentPrompt()`
- `generateAcademicDraft()` via the assignment-agent API prompt builder flow
- `runComplianceCheck()`
- `calculateReadinessScore()`
- `updateAssignmentStatus()`
- `generateSubmissionComment()`

## Persistence

No LMS integration was added. Assignment state is stored locally in the browser for now so future LMS or calendar integrations can attach to the same record model later.

## Verification

Build verified with:

```bash
npm run build
```

Test suite:

```bash
npm test
```

Current test coverage focuses on the academic agent workflow:

- `parseAssignmentPrompt()` requirement extraction
- `runComplianceCheck()` status, missing items, warnings, and next action
- `calculateReadinessScore()` and `updateAssignmentStatus()`
- local assignment record seeding and persistence behavior
- `/api/assignment-agent` request validation and mocked draft generation
- `AssignmentWorkspace` workflow integration for load, parse, and generate steps
