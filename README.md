# crowbro.dev

The home page for crowbro.dev: a crow on a telephone wire at dusk. It blinks,
looks around, and caws now and then. Click or tap it and it flies a loop of the
sky and lands back on the wire.

Asteroids with glowing tails streak across the top of the sky, one for each game
on the way (IdleSuits and Pixel-Taker), shedding embers as they go and coming
round again once they're off the far side. Hovering one slows it almost to a
stop so it's easy to catch; clicking sends it tumbling with a burst of sparks.
The crow knocks them off course if it flies through one. Clicking one goes to
its game, at `idlesuits.crowbro.dev` and `pixel-taker.crowbro.dev` (each
asteroid's `data-href` in `index.html`); an asteroid with no `data-href` just
says "soon!".

Plain HTML, CSS and JavaScript with no build step, served by GitHub Pages from
the `main` branch.

## Domain

- `crowbro.dev` and `www.crowbro.dev` point at GitHub Pages (DNS in Cloudflare,
  "DNS only"). The custom domain is set in the repo's Pages settings, with
  HTTPS enforced.
- The games live on their own subdomains, served by Cloudflare Workers.
