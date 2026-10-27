# Noisses

Original dual-stick foot-control skate simulator in the browser. Clean-room implementation from `bootstrap.md`. It is not Session, and it is not affiliated with Session.

Play it at **https://iamtew.github.io/Noisses/**. Bring a gamepad. The keyboard can watch.

## Run locally

Meat Bag hosts **http://localhost:8000**. Gamepad API needs a secure context (localhost or HTTPS).

Site images live in `static/img/`. Source art stays in `assets/`. After changing `assets/favicon.png`, run `just favicon` (`magick` on PATH) to refresh `static/img/favicon.ico` and `static/img/favicon.png`.

Without a two-stick gamepad you get a blocking overlay. Connect a pad, press any button to start.

## License

Copyright 2026 Mikael. [GNU AGPL 3.0](LICENSE). If you run a changed copy on a server, the people using it get the source too. The site links to the repo for that.

## Deploy (GitHub Pages)

GitHub Pages serves `master` from the repo root. The share card is `static/img/og.jpeg`. `index.html` is the site entry.
