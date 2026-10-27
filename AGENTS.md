# Clanker notes

Meat Bag play is the README and the in-game how-to. This file is the cheat.

## Debug flag

`http://localhost:8000/?clanker=yes` (`true` also works, case-insensitive).

Skips the controller gate, auto-starts, paints **CLANKER MODE**. A plugged-in pad still wins. No flag → pad required, keyboard does nothing.

Code: [`js/input/clanker.js`](js/input/clanker.js). Rule: [`.cursor/rules/clanker.mdc`](.cursor/rules/clanker.mdc).

## Sticks

Stick HUD is on. **Drag a pad** for analog. Two pointers can hold both feet. Release recenters. WASD / IJKL fill the stick you are not dragging.

Ollie: hold the right pad down (back foot), flick the left pad up. Goofy swaps that.

## Keys

| Keys | Pad |
|---|---|
| WASD | left stick |
| IJKL | right stick |
| F / Space | □ push / × push, jump, confirm |
| E / Q | △ mount / ○ stance, back |
| Escape | Options (tap pause, hold advanced) |
| R | R1 low cam |
| U / O | L2 / R2 |
| Arrows | d-pad |
| Z + X | L3 + R3 stick HUD |

Q closes pause. Escape tap will reopen it. Live with that.
