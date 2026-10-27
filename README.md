# Noisses

Original dual-stick foot-control skate simulator in the browser. Clean-room implementation from `bootstrap.md`. It is not Session, and it is not affiliated with Session.

Play it at **https://iamtew.github.io/Noisses/**. Bring a gamepad. The keyboard can watch.

## Run locally

Meat Bag hosts **http://localhost:8000**. Gamepad API needs a secure context (localhost or HTTPS).

Without a two-stick gamepad you get a blocking overlay. Connect a pad, press any button to start.

## Controls

PlayStation face buttons. On the board, left stick is the front foot and right stick is the back foot (Goofy swaps them).

- **△ Triangle** — get off the board, or get back on. The deck sits in the left hand, graphic out, gripped at the truck. Left stick walks, right stick swings the camera, × jumps, a second × runs until the stick recenters.
- **L3 + R3** — stick debug, both clicks together.
- **Hold Options** — advanced sliders, including gravity and time scale. 20% gravity is a lazy hang. 220% is a short hop. Time scale stock is 1 game hour per real minute.
- **Pause → Options** — hoodie, day/night (24h clock + sun angle), audio, then advanced.

## License

Copyright 2026 Mikael. [GNU AGPL 3.0](LICENSE). If you run a changed copy on a server, the people using it get the source too. The site links to the repo for that.

## Deploy (GitHub Pages)

GitHub Pages serves `master` from the repo root. The share card is `og.png`. `index.html` is the site entry.
