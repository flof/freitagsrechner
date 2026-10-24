# Freitagsrechner

A Friday-only calculator that answers one question: **at what time can I go home
once my weekly hours are fulfilled?** Frontend only, no backend, no account. All
state stays in the browser's `localStorage`.

## How it works

```
remaining  = weekly target − (Mon + Tue + Wed + Thu)
departure  = Friday start + remaining + Friday break
```

All values are net credited work time: breaks you already took Monday to
Thursday are not part of those four numbers, and the Friday break is entered
separately so it pushes the departure instead of silently shortening the day.

If Monday to Thursday already reach the weekly target, the app shows "Feierabend"
plus overtime instead of a departure time. If the departure would land after
midnight, the time is shown with a note that it is already Saturday.

## Development

Requires Node.js 22.12 or newer.

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # unit tests for the time math
npm run build    # type-checks and writes the static site to dist/
```

## Deployment

### Option 1: Docker build only (no Node.js on the VPS)

Build inside Docker and mount the repo's `dist/` directory out to the host so
your existing nginx can serve it:

```bash
git clone <your-repo-url> /opt/freitagsrechner
cd /opt/freitagsrechner
docker build -t freitagsrechner-build .
docker run --rm -v "$(pwd)/dist:/app/dist" freitagsrechner-build
```

`dist/` will appear on the host. Point your existing nginx at it, e.g.:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name freitag.example.com;

    root /opt/freitagsrechner/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

`sudo nginx -t && sudo systemctl reload nginx`. After `git pull`, rerun the
build and docker commands to refresh `dist/`.

### Option 2: Build on the VPS (Node.js required)

```bash
git clone <your-repo-url> /var/www/freitagsrechner
cd /var/www/freitagsrechner
npm ci
npm run build
```

The build output is plain static files in `dist/`. Point nginx at it as above.

### Subpath instead of its own domain

Set `base: '/freitag/'` in `vite.config.ts`, rebuild, and serve the app from
`location /freitag/ { try_files $uri $uri/ /freitag/index.html; }`.

## Behavior worth knowing

- A blank Monday–Thursday field counts as `0:00`; the fields start prefilled with
  `8:00` so a normal week needs no typing.
- "Woche zurücksetzen" clears the four days and the Friday start. The weekly
  target and the Friday break survive, because they rarely change.
- Values are saved on every keystroke, so a reload on Friday afternoon lands you
  back on your own numbers. Nothing resets automatically.
- There is no date awareness: the tool computes the same way whatever day you
  open it. Weekends and vacation days are simply `0:00` entries.

## Project layout

```
src/lib/time.ts       parsing, formatting and the departure calculation
src/lib/time.test.ts  unit tests for all of the above
src/lib/storage.ts    localStorage read/write and the week reset
src/App.tsx           the single page
GLOSSARY.md           shared vocabulary for this app
docs/adr/             decisions that are surprising without context
```
