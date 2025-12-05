Product Spec: The Onboarding Hub (Web-First)

Strategy Pivot: Move from "Headless/Slack-only" to "Web-First."
Core Value Prop: Onboarding documentation that heals itself.
Target Audience: 30–100 employee companies using stale Confluence pages.

1. The Core Philosophy: "The Living Playbook"

Confluence fails because it is Author-Centric (written by HR, read by no one).
Your app will be User-Centric. The new hire is not just a consumer of the docs; they are the QA Tester of the docs.

If a step says "Go to IT to get your key," but IT moved to the 3rd floor, the new hire should be able to flag or fix that immediately.

2. Innovative Features (The "Why Pay?" List)

To make this worth paying for, we need features that a static wiki cannot do.

A. The "Fix-It-Forward" System (Your Killer Feature)

The Pain: Instructions are always out of date. "Click the blue button" (but the button is now green).

The Feature: Every onboarding step has a "Report Issue" or "Suggest Edit" button right next to the "Mark as Done" button.

The Innovation: Encourage employees to actively improve documentation by making it easy to submit suggestions that managers can review and approve.

The Result: The onboarding process gets better with every new hire, rather than degrading over time.

B. "The Blocker Button" (SLA Tracking)

The Pain: A new hire gets stuck on Step 3 because they don't have permissions. They sit silently for 4 hours.

The Feature: A generic "I'm Stuck" button on every step.

The Innovation: When clicked, this doesn't just flag the step—it emails/notifies the specific owner of that step (not just the manager).

Example: The "Setup AWS" step is owned by the DevOps Lead. If a new hire clicks "Stuck," the DevOps Lead gets pinged, not HR.

C. Role-Based "Playlists" (No Noise)

The Pain: Confluence pages are one giant document. Salespeople have to scroll past "Install Docker" to find "Setup CRM."

The Feature: Dynamic filtering.

The Logic: You create one master database of steps, but tag them [All], [Engineering], [Sales].

The UI: The new hire only sees the timeline relevant to them.

D. The "Who do I ask?" Context

The Pain: "Install this software." Okay, it failed. Who knows how to fix it?

The Feature: Every step has a pinned "Subject Matter Expert" avatar.

The UI: "Step 4: Configure VPN. (Expert: Sarah from IT)."

3. The Webapp Experience (MVP)

The New Hire View (The "Quest Log")

Instead of a document, it looks like a vertical timeline (like a package tracking page).

Header: "Day 1 - 45% Complete" (Progress Bar).

The Cards: Each step is a card.

Left: The Instruction (Markdown text, images, code snippets).

Right: The Interaction.

[ Checkbox ] Mark as Done

[ ! ] Report Issue / Suggest Edit

[ ? ] I'm Stuck

State: Completed cards fade out or collapse to keep focus on the active task.

The Admin/Manager View (The "Dashboard")

Live Tracker: See exactly where the new hire is. "John is stuck on Step 4 (VPN Setup) for 3 hours."

The "Rot" Report: A list of steps that have been flagged as "Outdated" by new hires. This tells the Admin exactly what needs fixing.

4. Technical Stack (Web-First)

Since we want a fast, interactive webapp with real-time updates (so the manager sees "Done" the second the employee clicks it), we should use a real-time DB.

Frontend: React (Vite) + Tailwind CSS (for clean UI).

Backend/DB: Firebase (Firestore).

Why? It handles Auth, Database, and Real-time subscriptions out of the box. You can build the MVP in a weekend.

Hosting: Vercel or Firebase Hosting.

5. Data Model (Firestore)

Collection: templates (The Master Instructions)

id: "setup_vpn"

title: "Setup VPN"

content: "Download the client here..."

role_tags: ["engineering", "product"]

owner_id: "user_sarah_it"

version: 1.2

Collection: onboarding_instances (The specific run for a user)

id: "onboard_john_doe"

user_id: "john_doe"

template_snapshot: [ ...copy of steps at time of creation... ]

progress: {
"setup_vpn": "STUCK",
"slack_login": "COMPLETED"
}

Collection: suggestions (The "Fix-it-Forward" data)

step_id: "setup_vpn"

suggested_by: "john_doe"

suggestion_text: "The link is broken, use https://www.google.com/search?q=vpn.company.com/new"

status: "PENDING_REVIEW"

6. The Roadmap (Working Upwards)

Phase 1 (The MVP): Web portal. Users log in, see steps, check boxes. Managers see progress.

Phase 2 (The Feedback Loop): Add the "Suggest Edit" and "I'm Stuck" buttons.

Phase 3 (Integrations): Now we add the Slack bot. "Hey, you haven't checked a box in 4 hours. Need help?"

Phase 4 (Automation): API hooks. When they check "Create Github Account," it actually goes and invites them via GitHub API.