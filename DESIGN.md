# Design System

## Direction

This product uses a restrained public-service product language: clear hierarchy, high readability, dense work surfaces, and modest motion. It should feel like a reliable operations console for enterprise, carrier, and government users, not a marketing site.

## Visual Rules

- Primary brand color: `#14508c`
- Government accent: `#9a5b12`
- Carrier accent: `#0b7568`
- Canvas: `#edf3f8`
- Surface: `#ffffff`
- Text: `#18263a`
- Muted text: `#52647a`
- Border: `#d7e2ee`
- Radius scale: 6, 8, 10, 12
- Motion: 140ms to 220ms, easing `cubic-bezier(0.22, 1, 0.36, 1)`

## Component Principles

- Buttons use clear semantic hierarchy: one primary action per section, secondary actions stay quiet.
- Forms keep visible labels. Placeholders only supplement labels.
- Tables and lists favor compact scanning, subdued hover states, and stable row height.
- Cards are used for real semantic grouping, not for every page section.
- Dialogs and drawers are used only when preserving page context helps the task.
- Motion communicates focus, state change, or data refresh. It must respect `prefers-reduced-motion`.

## Accessibility Baseline

- Text contrast targets WCAG AA.
- Keyboard users get visible focus rings.
- Role navigation exposes an ARIA label.
- Route loading uses `role="status"` and `aria-live`.
- Color is not the only state indicator; status text and icons remain present.

