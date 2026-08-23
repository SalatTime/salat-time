#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from 'adhan';

const ROOT = process.cwd();
const CITY_DIR = path.join(ROOT, 'data', 'cities');
const OUT_DIR = path.join(ROOT, 'data', 'times');
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';
const SHARDS = 1024;
const DAYS = 3;
const METHODS = { dz: 'mwl', sa: 'ummAlQura', eg: 'egyptian', ma: 'mwl', tn: 'mwl', tr: 'turkey', ru: 'mwl', pk: 'karachi', in: 'mwl', bd: 'karachi', gb: 'mwl', fr: 'mwl', us: 'northAmerica', ca: 'northAmerica', id: 'singapore', my: 'singapore', sg: 'singapore', qa: 'qatar', kw: 'kuwait', ae: 'dubai', jo: 'mwl', ir: 'tehran' };

const pad = n => String(n).padStart(2, '0');
const shard = id => (Number(id) % SHARDS).toString(16).padStart(3, '0');
const methodFor = code => METHODS[code] || 'mwl';
function paramsFor(code) {
  const name = methodFor(code);
  const factory = { mwl: CalculationMethod.MuslimWorldLeague, egyptian: CalculationMethod.Egyptian, ummAlQura: CalculationMethod.UmmAlQura, karachi: CalculationMethod.Karachi, turkey: CalculationMethod.Turkey, northAmerica: CalculationMethod.NorthAmerica, singapore: CalculationMethod.Singapore, qatar: CalculationMethod.Qatar, kuwait: CalculationMethod.Kuwait, dubai: CalculationMethod.Dubai, tehran: CalculationMethod.Tehran }[name] || CalculationMethod.MuslimWorldLeague;
  const p = factory();
  p.madhab = Madhab.Shafi;
  return p;
}
function localDateParts(timeZone, offset) {
  const d = new Date(Date.now() + offset * 86400000);
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
  const o = Object.fromEntries(parts.map(x => [x.type, x.value]));
  return { year: +o.year, month: +o.month, day: +o.day, iso: `${o.year}-${o.month}-${o.day}` };
}
function fmt(date, timeZone) {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) return null;
  const p = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(date);
  const o = Object.fromEntries(p.map(x => [x.type, x.value]));
  return `${o.hour}:${o.minute}`;
}
function prayerFor(city, offset) {
  const tz = city.timezone || 'UTC';
  const d = localDateParts(tz, offset);
  const date = new Date(Date.UTC(d.year, d.month - 1, d.day));
  const pt = new PrayerTimes(new Coordinates(city.lat, city.lon), date, paramsFor(city.countryCode));
  return { date: d.iso, timezone: tz, fajr: fmt(pt.fajr, tz), sunrise: fmt(pt.sunrise, tz), dhuhr: fmt(pt.dhuhr, tz), asr: fmt(pt.asr, tz), maghrib: fmt(pt.maghrib, tz), isha: fmt(pt.isha, tz) };
}

async function loadCities() {
  const files = (await fs.readdir(CITY_DIR)).filter(f => f.endsWith('.json'));
  const byId = new Map();
  for (const file of files) {
    const rows = JSON.parse(await fs.readFile(path.join(CITY_DIR, file), 'utf8'));
    for (const c of rows) if (!byId.has(c.id)) byId.set(c.id, c);
  }
  return [...byId.values()];
}
async function fetchWeather(batch) {
  const lat = batch.map(c => c.lat).join(',');
  const lon = batch.map(c => c.lon).join(',');
  const url = `${WEATHER_URL}?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weather_code&temperature_unit=celsius&timezone=auto&forecast_days=${DAYS}`;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(60000) });
      if (!r.ok) throw new Error(`weather ${r.status}`);
      const j = await r.json();
      return Array.isArray(j) ? j : [j];
    } catch (e) {
      if (attempt === 4) throw e;
      await new Promise(r => setTimeout(r, attempt * 1500));
    }
  }
}

const cities = await loadCities();
console.log(`Preparing ${cities.length} unique cities for ${DAYS} days`);
await fs.rm(OUT_DIR, { recursive: true, force: true });
await fs.mkdir(OUT_DIR, { recursive: true });
const output = Array.from({ length: SHARDS }, () => ({}));

for (let i = 0; i < cities.length; i++) {
  const c = cities[i];
  const key = String(c.id);
  output[Number(c.id) % SHARDS][key] = { timezone: c.timezone || 'UTC', days: [0, 1, 2].map(n => prayerFor(c, n)) };
  if ((i + 1) % 10000 === 0) console.log(`Prayer calculations: ${i + 1}/${cities.length}`);
}

const BATCH = 1000;
for (let i = 0; i < cities.length; i += BATCH) {
  const batch = cities.slice(i, i + BATCH);
  const weather = await fetchWeather(batch);
  for (let j = 0; j < batch.length; j++) {
    const c = batch[j];
    const w = weather[j];
    if (!w?.daily) continue;
    const entry = output[Number(c.id) % SHARDS][String(c.id)];
    entry.weather = w.daily.time.map((date, k) => ({ date, max: Math.round(w.daily.temperature_2m_max?.[k] ?? 0), min: Math.round(w.daily.temperature_2m_min?.[k] ?? 0), code: w.daily.weather_code?.[k] ?? null }));
  }
  console.log(`Weather: ${Math.min(i + BATCH, cities.length)}/${cities.length}`);
}

for (let i = 0; i < SHARDS; i++) {
  const rows = output[i];
  if (Object.keys(rows).length) await fs.writeFile(path.join(OUT_DIR, `${shard(i)}.json`), JSON.stringify(rows));
}
await fs.writeFile(path.join(OUT_DIR, 'manifest.json'), JSON.stringify({ generatedAt: new Date().toISOString(), cityCount: cities.length, days: DAYS, shards: SHARDS, source: 'GeoNames + Adhan JS + Open-Meteo' }, null, 2));
console.log('Global prayer + weather database generated.');
