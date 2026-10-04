// Server-only module; /docs is excluded from public static delivery.
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const dateFormat = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' });
function berlinDate(t) {
  const parts = Object.fromEntries(dateFormat.formatToParts(new Date(t)).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
function dayBounds(day) {
  const noon = Date.parse(day + 'T12:00:00Z');
  let start = noon - 16 * 3600000;
  while (berlinDate(start) !== day) start += 900000;
  let end = start + 20 * 3600000;
  while (berlinDate(end) === day) end += 900000;
  return { start, end };
}
function validate(data, day) {
  if (!data || data.day !== day || data.unit !== 'ct/kWh' || !Number.isFinite(Date.parse(data.updated))) throw Error('Invalid metadata');
  const { start, end } = dayBounds(day);
  const rows = data.prices;
  if (!Array.isArray(rows) || rows.length !== (end - start) / 900000) throw Error('Incomplete day');
  rows.forEach((p, i) => {
    if (p.start !== start + i * 900000 || p.end !== p.start + 900000 || !Number.isFinite(p.priceCtKwh)) throw Error('Invalid price interval');
  });
  return data;
}
function createPriceService({ fetcher = fetch, now = Date.now, cacheFile = path.join(os.tmpdir(), 'patrickleissner-spotprice-v2.json'), log = console.warn } = {}) {
  let saved = {}, pending, lastAttempt = 0;
  const ready = fs.readFile(cacheFile, 'utf8').then(s => { saved = JSON.parse(s); }).catch(() => {});
  async function json(url) {
    const r = await fetcher(url, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) throw Error(`HTTP ${r.status}`);
    return r.json();
  }
  function fromSeries(series, day, source) {
    if (!Array.isArray(series)) throw Error('Invalid series');
    return validate({ day, unit: 'ct/kWh', source, updated: new Date(now()).toISOString(), prices: series
      .filter(p => Number.isFinite(p[0]) && berlinDate(p[0]) === day)
      .map(([start, value]) => ({ start, end: start + 900000, priceCtKwh: typeof value === 'number' ? value / 10 : null }))
      .sort((a, b) => a.start - b.start) }, day);
  }
  async function smard(day) {
    const base = 'https://www.smard.de/app/chart_data/4169/DE-LU/';
    const index = await json(base + 'index_quarterhour.json');
    const timestamp = index.timestamps?.filter(t => Number.isFinite(t) && t <= dayBounds(day).start).sort((a, b) => a - b).at(-1);
    if (!timestamp) throw Error('Missing SMARD index');
    const raw = await json(base + `4169_DE-LU_quarterhour_${timestamp}.json`);
    const data = fromSeries(raw.series, day, 'Bundesnetzagentur | SMARD.de');
    // Store tomorrow when already published, so midnight does not depend on a fresh upstream request.
    const tomorrow = berlinDate(dayBounds(day).end);
    try { saved[tomorrow] = fromSeries(raw.series, tomorrow, data.source); } catch {}
    return data;
  }
  async function energy(day) {
    const raw = await json(`https://api.energy-charts.info/price?bzn=DE-LU&start=${day}&end=${day}`);
    if (!/EUR.*MWh/i.test(raw.unit) || !Array.isArray(raw.unix_seconds) || !Array.isArray(raw.price)) throw Error('Invalid Energy-Charts units');
    return fromSeries(raw.unix_seconds.map((t, i) => [t * 1000, raw.price[i]]), day, 'Fraunhofer ISE Energy-Charts');
  }
  async function persist(day) {
    saved = Object.fromEntries(Object.entries(saved).filter(([key]) => key >= day && key <= berlinDate(dayBounds(day).end)));
    const temp = cacheFile + '.' + process.pid + '.tmp';
    try { await fs.writeFile(temp, JSON.stringify(saved), { mode: 0o600 }); await fs.rename(temp, cacheFile); }
    catch { log('[spotprice] Persistent cache unavailable'); }
  }
  async function get() {
    await ready;
    const day = berlinDate(now());
    let cached;
    try { cached = validate(saved[day], day); } catch {}
    if (cached && now() - Date.parse(cached.updated) < 1800000) return { ...cached, cached: true };
    if (pending) return pending;
    if (lastAttempt && now() - lastAttempt < 60000) {
      if (cached) return { ...cached, cached: true, stale: true };
      throw Error('Upstream retry cooldown');
    }
    lastAttempt = now();
    pending = (async () => {
      for (const source of [smard, energy]) {
        try {
          const data = await source(day);
          saved[day] = data;
          await persist(day);
          return { ...data, cached: false };
        } catch (e) { log(`[spotprice] ${source.name}: ${e.message}`); }
      }
      if (cached) return { ...cached, cached: true, stale: true };
      throw Error('No complete prices for today');
    })();
    try { return await pending; } finally { pending = null; }
  }
  return { get };
}
module.exports = { createPriceService, berlinDate, dayBounds, validate };
