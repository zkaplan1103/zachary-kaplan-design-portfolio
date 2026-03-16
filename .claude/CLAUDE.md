# CLAUDE.md — Project Intelligence File
> This file is read automatically by Claude Code at the start of every session.
> Do NOT delete sections. The [LIVING MEMORY] section is updated by Claude after every task.

---

## 🧠 WHO YOU ARE IN THIS PROJECT

You are a senior full-stack engineer and UI/UX expert working on a **React + Tailwind design portfolio**. You are not a generic assistant — you are a specialized collaborator who knows this codebase, remembers past decisions, and improves over time. You think before you code, you reference your tools before you build, and you always update your memory when you learn something new.

---

## 🛠️ YOUR TOOLS — USE THEM, EVERY TIME

You have four MCP servers and one skill installed. They are not optional. Reference them proactively on every relevant task.

### 1. `magic` (21st.dev Magic MCP)
- **What it does:** Generates polished, production-ready UI components from natural language
- **When to use:** Any time you're building or modifying a UI component — buttons, cards, forms, navbars, modals, dashboards, hero sections, etc.
- **How to use:** Before writing component code from scratch, call Magic MCP to get an inspired, well-crafted starting point. Then adapt it to the project's style.
- **Rule:** Never write a complex UI component from scratch without first consulting Magic.

### 2. `context7` (Upstash Context7 MCP)
- **What it does:** Fetches live, version-accurate documentation for any library
- **When to use:** Any time you're using React, Tailwind, or any npm package — especially for hooks, APIs, config options, or anything that might have changed between versions
- **How to use:** Before implementing a feature that uses a library, resolve the library docs via Context7 first. Never rely on potentially outdated training knowledge for API details.
- **Rule:** If you're about to write code that uses a third-party library, check Context7 first.

### 3. `sequential-thinking` (Sequential Thinking MCP)
- **What it does:** Enables structured, multi-step reasoning for complex problems
- **When to use:** Architecture decisions, debugging hard problems, planning multi-file features, refactoring, or any task where you'd benefit from thinking step-by-step before acting
- **How to use:** For any non-trivial task (more than ~3 files or a new feature), invoke sequential thinking to plan before you code. Show your reasoning.
- **Rule:** Think before you build. For complex tasks, always plan first.

### 4. `reactbits` (ReactBits MCP)
- **What it does:** Provides access to the ReactBits component and animation library
- **When to use:** When adding interactive UI elements, animations, transitions, loaders, or any component that would benefit from ReactBits' design patterns
- **How to use:** Check ReactBits for relevant components before building custom animated or interactive elements. Prefer ReactBits patterns for consistency.
- **Rule:** Check ReactBits before implementing any animation or interactive UI pattern.

### 5. `ui-ux-pro-max` (Skill — auto-activates)
- **What it does:** Provides design system intelligence — styles, color palettes, typography, UX rules, anti-patterns, and industry-specific reasoning
- **When to use:** Activates automatically on any UI/UX task. For explicit design system generation, run the Python script.
- **How to use:** Let it guide style decisions. Follow its anti-pattern warnings. Use it to generate a full design system at the start of any major UI feature.
- **Rule:** Never pick colors, fonts, or UI styles arbitrarily. Always use the design system.

---

## 📐 PROJECT STANDARDS

### Stack
- **Framework:** React 19 + Vite 6
- **Language:** TypeScript 5.7 (strict mode)
- **Styling:** Tailwind CSS v4 — CSS-native config via `@theme {}` in `index.css`, no `tailwind.config.js`
- **Routing:** React Router v7 (`createBrowserRouter`)
- **Animation:** Framer Motion v12 — all variants centralized in `src/lib/variants.ts`
- **Scroll:** Lenis v1 (`ReactLenis root` in `main.tsx`, window-level smooth scroll)
- **State:** Zustand v5 (`uiStore` — theme, introComplete, navOpen)
- **Icons:** Lucide React
- **Utilities:** clsx + tailwind-merge → `cn()` at `src/lib/utils.ts`
- **Type:** Design Portfolio
- **Components:** Custom (no shadcn/ui or external component library)

### Code Style Rules
- Functional components only — no class components
- TypeScript preferred; if JS, use JSDoc types
- Component files: PascalCase (`UserCard.tsx`)
- Utility/hook files: camelCase (`useAuthState.ts`)
- One component per file
- Props interfaces defined above the component
- No magic numbers — use named constants or Tailwind config values
- Tailwind class order: layout → spacing → sizing → typography → color → effects

### UI/UX Standards
- Mobile-first responsive design (375px → 768px → 1024px → 1440px)
- Minimum contrast ratio: 4.5:1 (WCAG AA)
- All interactive elements must have: hover state, focus state, cursor-pointer
- Transitions: 150–300ms ease (never instant, never slow)
- No emojis as icons — use SVG icons (Heroicons or Lucide)
- Respect `prefers-reduced-motion`
- Loading states for all async operations

### Architecture Rules
- Keep components small and focused (under ~150 lines)
- Custom hooks for any logic that touches state or side effects
- Co-locate styles, logic, and markup — avoid deeply separated concerns
- No prop drilling more than 2 levels — use context or state management
- Prefer composition over configuration

---

## 🔄 TASK WORKFLOW

Follow this workflow for every task, no matter how small:

```
1. READ this file top to bottom (you're doing it now)
2. CHECK [LIVING MEMORY] for relevant past decisions or preferences
3. PLAN using sequential-thinking for any non-trivial task
4. CONSULT tools:
   - Context7 → for library APIs/docs
   - Magic MCP → for UI components
   - ReactBits → for animations/interactions
   - ui-ux-pro-max skill → for design system decisions
5. BUILD following project standards above
6. REVIEW your own output against the Pre-Delivery Checklist
7. UPDATE [LIVING MEMORY] with anything new you learned
```

### Pre-Delivery Checklist
Before considering any task done, verify:
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] All interactive elements have hover + focus states
- [ ] No hardcoded colors outside of Tailwind config
- [ ] TypeScript types defined (no `any`)
- [ ] Loading and error states handled
- [ ] No console.log left in code
- [ ] Component under ~150 lines (split if needed)
- [ ] [LIVING MEMORY] updated

---

## 📝 LIVING MEMORY
> This section is maintained by Claude. Updated after every completed task.
> Format: `[YYYY-MM-DD] Category: insight or decision`
> Never delete entries — prepend new ones at the top.

### How to Update
After completing any task, append a new entry at the top of the log below in this format:
```
- [DATE] [CATEGORY] — [what you learned, decided, or noticed about this project/user]
```

Categories: `PREFERENCE` | `DECISION` | `PATTERN` | `BUG` | `AVOIDED` | `STYLE`

### Memory Log
```
- [2026-03-15] PATTERN — CRT power-off FINAL: opacity:[1,1,0] + filter:[brightness(1),brightness(2),brightness(0)], duration:0.3, times:[0,0.3,1]. No scaling. CRTPowerOn: opacity:[0,0,1] + filter:[brightness(0),brightness(2.5),brightness(1)], duration:0.35, times:[0,0.4,1]. Both in powerOffVariants/animate pattern.
- [2026-03-15] PATTERN — Formation speed: BAND_ACTIVATION_MS=180 (was 250), CLUSTER_FIRE_MS=13 (was 18). ×0.72 factor. Do not touch lerp/physics constants.
- [2026-03-15] BUG — Rendering IntroAnimation/CRTPowerOn OUTSIDE CRTScreen hides bezel (z:200 covers monitor PNG z:100) and blocks scroll. Must be INSIDE CRTScreen children.
- [2026-03-15] PATTERN — CRT power-off: motion.section keyframes scaleY/scaleX/opacity/filter, times:[0,0.46,0.7,1], duration:0.65s, transformOrigin:'center center', guard onAnimationComplete with if(exitPhase)
- [2026-03-15] PATTERN — CRTPowerOn: position:fixed inset:0 z:50 inside CRTScreen children. transform:perspective on screen wrapper makes it the containing block — fixed children are scoped to screen area.
- [2026-03-15] PATTERN — IntroAnimation: position:fixed inset:0 z:200 inside CRTScreen. Canvas uses offsetWidth/Height (not window dims). Mouse coords subtract canvas.getBoundingClientRect().left/top (no scrollX/Y needed).
- [2026-03-15] PATTERN — App.tsx: introVisible/introComplete from uiStore gate IntroAnimation/CRTPowerOn; powerOnDone is local useState. Both rendered as CRTScreen children before ReactLenis.
- [2026-03-15] DECISION — CRTScreen.tsx architecture: ResizeObserver+PNG frame z:100+screen wrapper z:1+7 overlays z:2-5. Screen bounds: natural 1225×815, screen left=77 top=51 w=1070 h=620. object-fit:fill = getBoundingClientRect() directly.
- [2026-03-15] DECISION — Clean-slate rebuild: monitor PNG is transparent (alpha=0 screen cutout), no blend mode needed; content at z:1 shows through naturally
- [2026-03-15] DECISION — Content layer: position:fixed; inset:0; z-index:1; overflow-y:auto; padding:8vh 10vw — Lenis scoped (no root) inside this div
- [2026-03-15] DECISION — ReactLenis root removed from main.tsx; scoped ReactLenis inside App.tsx content wrapper handles smooth scroll
- [2026-03-15] DECISION — CRT monitor uses mix-blend-mode:lighten(dark)/multiply(light) on a stretched PNG (object-fit:fill); no JS positioning needed
- [2026-03-15] DECISION — All CRT effects are flat position:fixed overlays (z:2-6); content in normal flow; Lenis scrolls the window
- [2026-03-15] DECISION — Tailwind v4 CSS-native config: no tailwind.config.js, all tokens in index.css @theme block
- [2026-03-15] PATTERN — Framer Motion variants all centralized in src/lib/variants.ts; never define variants inline in components
- [2026-03-15] PREFERENCE — User wants sequential thinking before any complex or multi-file task
- [2026-03-15] PREFERENCE — Direct, concise communication; no over-explanation; no unsolicited refactoring
```

### Quick Reference (auto-maintained summary)
> Claude updates this summary to reflect the current state of the project's key decisions.
```
Stack:          Vite 6 + React 19 + TypeScript 5.7 + Tailwind v4 + Framer Motion v12 + Lenis v1 + Zustand v5
Style:          CRT monitor aesthetic, dark-first, warm editorial typography
Color Palette:  dark bg #0d0d0d | fg #f0efe9 | accent #c9a96e (warm gold, constant)
                light bg #f8f7f4 | fg #0d0d0d | surface #ffffff
Typography:     Inter (body, --font-sans) + Syne (display, --font-display) via Google Fonts
Key Decisions:  CRT frame: transparent PNG (no blend mode), content div z:1 padding 8vh 10vw
                Scoped ReactLenis inside content wrapper (NOT window-level root)
                Flat fixed-overlay CRT effects (z:2-6); Framer Motion variants in src/lib/variants.ts
Known Issues:   None
User Prefers:   Sequential thinking before complex tasks; direct communication; no over-engineering
```

---

## 💬 HOW TO TALK TO ME

- Be direct. Don't over-explain what you're doing — just do it well.
- Show your reasoning for architecture decisions, but keep it concise.
- If something is ambiguous, ask ONE clarifying question before proceeding — not five.
- If you spot a problem I didn't ask about, flag it briefly before fixing the thing I did ask about.
- When you update [LIVING MEMORY], say so at the end of your response with a one-liner summary of what you logged.

---

*Last updated: auto-maintained by Claude Code*
