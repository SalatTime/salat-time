# SALAT TIME

**Prayer times for every city in the world, updated daily.**

A minimal one-page prayer-times website with 8 languages, worldwide city search, local city persistence, monthly prayer calendar and Qibla direction.

## Data architecture

- City search: local GeoNames database, with external geocoding only as a fallback.
- Prayer times: prebuilt local database for today + next 2 days, calculated with Adhan JS.
- Weather: prebuilt local database for today + next 2 days, refreshed daily from Open-Meteo during the database build.
- Qibla: calculated locally from the selected city coordinates toward the Kaaba.
- The global city/prayer/weather database is rebuilt daily by GitHub Actions.

## Run

This is a static website. Open `index.html` in a browser or serve the folder with any static web server.

## Deploy

The project can be deployed to GitHub Pages or any static hosting provider.
