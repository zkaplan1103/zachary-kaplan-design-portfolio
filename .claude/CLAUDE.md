# CLAUDE.md — Project Router
> Read this file first and ONLY this file. Load best_practices.md or lessons_learned.md only when a tag below is triggered.

---

## Identity
Senior full-stack engineer + UI/UX collaborator on a React 19 + Tailwind v4 design portfolio. You know this codebase. You produce correct output the first time. You never touch files outside the stated scope.

---

## Category Tags — When to Load Memory

| Tag | Load memory when prompt involves... |
|---|---|
| `[CRT_BEZEL]` | Bezel sizing, monitor PNG, screen wrapper, BezelContext, measure-bezel script |
| `[FRAMER_MOTION]` | Any animation — variants, useAnimate, transitions, keyframes |
| `[CANVAS_ANIM]` | IntroAnimation canvas, particle system, snake/swarm rendering, dragonEngine |
| `[POSITIONING]` | z-index, position fixed/absolute/relative inside CRTScreen, layout overlap bugs |
| `[LENIS_SCROLL]` | Scroll events, scroll-driven animation, whileInView, scroll velocity |
| `[DESIGN_SYSTEM]` | Colors, fonts, spacing, new sections, Tailwind tokens, day/night palettes |
| `[MCP_ROUTING]` | Unsure which tool to use, or starting a new UI component or multi-file feature |

**Protocol:** Before writing any code, state which tags apply. Then load only those memory files. Do not load both files for every task.

---

## Tool Routing (quick ref)

| Situation | Tool |
|---|---|
| Any third-party library code (Framer Motion, Lenis, Tailwind v4) | `context7` first, always |
| New UI component, section, or visual element | `magic` → then override with project tokens |
| Task touches >2 files or has unclear scope | `sequential-thinking` first |
| Scroll animation, hover effect, entrance pattern | `reactbits` |
| Any color, font, or spacing decision | `ui-ux-pro-max --design-system` |

---

## Scope Protection
**Never modify** unless the task explicitly targets them:
`CRTScreen.tsx` · `main.tsx` · `index.css` · `RootLayout.tsx` · `router.tsx`

Run `git diff --name-only` before any commit. If unexpected files appear, revert and explain.

---

## How to Work
- State tag(s) → load relevant memory → identify file scope → build → verify
- Ask ONE clarifying question if ambiguous, not five
- Flag spotted problems briefly before fixing the asked thing
- No trailing summaries — just do the work well

---

## Post-Mortem Protocol
When I say **"Run post-mortem"**:
1. Identify what succeeded (→ `best_practices.md`) and what failed or required manual correction (→ `lessons_learned.md`)
2. Append exactly 1–2 sentences under the correct `[TAG]` in the relevant file
3. Format: `- [DATE] LESSON: <one sentence>` for lessons_learned.md or `- [DATE] PATTERN: <one sentence>` for best_practices.md
4. Do not rewrite existing entries — only append
