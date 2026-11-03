# Flywheel Home: launcher harness

Contains no data. Spike harness, not the product.

A working version of the proposed Flywheel home page, where persona apps sit beside Core and Gear Exchange:
- **Needs Attention:** a short list of what is waiting on you.
- **Ask Fermi:** the entry point for the assistant.
- **Apps:** Core, Reader Portal, Data Portal, Sponsor View and Gear Exchange.
- **Support and Team Settings.**

Built on the **Flywheel Vision Design System**. `vision-components.js` is compiled from the system's own React sources (tree-shaken to the components this page uses; see `vision-components.entry.js`). `tokens.css`, `bundle.css`, `vision-icons.css` and the icon font (subset to the glyphs used) come from the same system.

It runs as a **Flywheel extension app** (Viewer type, matched to projects). It reads through the Extension SDK's `apiRequest` proxy, so the page never sees a token. It is **read-only** and makes no write calls.

## What is live and what is not
| Area | Source |
|---|---|
| Signed-in user, site-admin flag | `GET /api/users/self` |
| Needs Attention (Reader, Site Admin, Data Manager) | `GET /api/tasks/reader`, blinded columns only (`task_id,created,status,priority,protocol_label,assignee,parents,due_date,subcategory,read_number,modified`); paged with `sort=created:desc,task_id:asc` |
| Reader Portal (Launch → full screen) | Same tasks, filtered to the signed-in user; **Start Read** opens `/ohif-viewer-v3/project/{id}/reader?taskId=` in a new tab |
| Data Portal (Launch) | Opens `<site>/upload/` in a new tab |
| Needs Attention (Uploader, Sponsor) | **Sample** rows, tagged as such: those apps have no attention feed yet |
| Sponsor View | Concept only, no build |
| Ask Fermi | Preview only, not connected |
| **Preview As** | Switches the persona the page renders for; data stays what your own account can see |

## Try it without Flywheel
Add `#demo` to the URL for fictional sample data.

## Register it on a site (admin)
**Admin → Applications → Register New Application**. Type: **Viewer**. Name: **Home Launcher (harness)**. URL: the Pages link plus `?v=N` (bump N after each push). Match: **Project** containers. Launch it from any project's ⋮ › **Launch In**.
