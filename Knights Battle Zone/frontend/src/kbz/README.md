# KBZ Frontend Rebuild

This module is the isolated frontend rebuild surface for Knights Battle Zone.
It keeps the existing `src/lib/api.ts` client and backend contract unchanged.

## Structure

- `components/` — reusable battle-station UI primitives
- `data/` — temporary frontend display data
- `features/` — feature-specific UI compositions
- `layouts/` — Command Deck and responsive navigation layouts
- `pages/` — rebuilt page compositions
- `styles/` — KBZ tokens, effects, and component styles
- `types.ts` — shared frontend-only view models

## Build order

1. Project structure and font roles
2. Theme tokens and theme provider integration
3. Command Deck HUD, bottom navigation, and theme toggle
4. Player and rank primitives
5. Hex stat tiles and sword progress
6. Skill tree and season pass
7. Duel, integrity, and career widgets
8. Command Deck dashboard composition
9. Remaining feature pages

The original pages remain available while each replacement is completed and wired to the same frontend API client.
