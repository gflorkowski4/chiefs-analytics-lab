let allPlays = []; // loaded from JSON, then filtered by the UI

// Load the plays from the JSON file.
async function loadPlays() {
  const res = await fetch("chiefs_plays_all.json");
  if (!res.ok) throw new Error("HTTP " + res.status);
  allPlays = await res.json();
  updatePulse(allPlays); // the data is here now — build the strip
}

loadPlays();

// Wrapped in a function, so you can ask it about any season.
function latestWeek(plays, season) {
  // Step A — keep only that season's regular-season plays.
  const reg = plays.filter(p => p.season === season && p.season_type === "REG");

  // Step B — walk them, carrying the biggest week seen so far.
  // reduce starts the accumulator at 0, then for each play:
  // "accumulator, meet play — whichever week is bigger survives."
  return reg.reduce((max, p) => Math.max(max, p.week), 0);
}

// The filter from step 1, as its own little function — Lab 3 and the
// final chain need the pool too, so it earns a name of its own.
function weekPool(plays, season, week) {
  return plays.filter(p =>
    p.season === season && p.season_type === "REG" && p.week === week);
}

function weekStats(plays, season, week) {
  // 1 · Shrink to just this week — this smaller array is the "pool".
  const pool = weekPool(plays, season, week);

  // 2 · THE GUARD. If the pool is empty, stop here and say so.
  if (pool.length === 0) return null;

  // 3 · Add up EPA, and add up successes, in two reduce walks.
  const totalEPA  = pool.reduce((sum, p) => sum + p.epa, 0);
  const successes = pool.reduce((sum, p) => sum + p.success, 0);

  // 4 · Divide. Safe now — the guard proved pool.length isn't 0.
  return {
    plays:   pool.length,
    epaPlay: totalEPA / pool.length,
    success: successes / pool.length
  };
}

const fmtEPA = n => (n >= 0 ? "+" : "") + n.toFixed(3);
const fmtPct = n => (n * 100).toFixed(1) + "%";

function renderPulse(week, stats, best, worst) {
  document.getElementById("pulse-title").textContent = "Week " + week + " Key Stats";
  document.getElementById("pulse-epa").textContent = fmtEPA(stats.epaPlay) + " EPA/play";
  document.getElementById("pulse-success").textContent = fmtPct(stats.success);
  document.getElementById("pulse-plays").textContent = stats.plays;
  document.getElementById("pulse-best").textContent = fmtEPA(best.epa);
  document.getElementById("pulse-best-desc").textContent = best.desc;
  document.getElementById("pulse-worst").textContent = fmtEPA(worst.epa);
  document.getElementById("pulse-worst-desc").textContent = worst.desc;
}

function updatePulse(plays) {
  const week  = latestWeek(plays, 2026);      // Lab 1
  const pool  = weekPool(plays, 2026, week);    // Lab 2's filter
  const stats = weekStats(plays, 2026, week);   // Lab 2 (null if empty)
  if (!stats) return;                          // the guard, at the door
  const best  = pool.reduce((c, p) => p.epa > c.epa ? p : c);  // Lab 3
  const worst = pool.reduce((c, p) => p.epa < c.epa ? p : c);  // Lab 3
  renderPulse(week, stats, best, worst);        // Lab 4
}
