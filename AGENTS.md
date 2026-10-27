# Clanker notes

Meat Bag play is the README and the in-game how-to. This file is the cheat.

## Debug flag

`http://localhost:8000/?clanker=yes` (`true` also works, case-insensitive).

Skips the controller gate, auto-starts, paints **CLANKER MODE**. A plugged-in pad still wins. No flag → pad required, keyboard does nothing.

Code: [`js/input/clanker.js`](js/input/clanker.js). Rule: [`.cursor/rules/clanker.mdc`](.cursor/rules/clanker.mdc).

## Sticks

Stick HUD is on. **Drag a pad** for analog. Two pointers can hold both feet. Release recenters. WASD / IJKL fill the stick you are not dragging.

There is no Goofy. Stance is Regular or Switch. Pause → Options Stance and ○ on the ground both flip it. It persists.

| | Left on nose | Right on nose |
|---|---|---|
| Back pops | Regular | Switch |
| Front pops | Nollie | Fakie |

Fakie is rolling tail-first. Nollie is switch + fakie.

Regular ollie: right pad down, left pad up. Kickflip: same hold, left pad left. Heelflip: left pad right. Nollie ollie: left pad down, right pad up.

## Keys

| Keys | Pad |
|---|---|
| WASD | left stick |
| IJKL | right stick |
| F / Space | □ push / × push, jump, confirm |
| E / Q | △ mount / ○ switch, back |
| Escape | Options (tap pause, hold advanced) |
| R | R1 low cam |
| U / O | L2 / R2 |
| Arrows | d-pad |
| Z + X | L3 + R3 stick HUD |

Q closes pause. Escape tap will reopen it. Live with that.
