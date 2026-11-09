// State: one pristine array. Everything else is derived.
let allPlays = [];

const seasonFilter = document.getElementById("seasonFilter");
const weekFilter = document.querySelector("#weekFilter");
const downFilter = document.querySelector("#downFilter");
const typeFilter = document.querySelector("#typeFilter");
const playsBody = document.querySelector("#playsBody");
const summaryEl = document.querySelector("#summary");
const errorEl = document.querySelector("#loadError");

async function loadPlays() {
  try {
    const res = await fetch("chiefs_plays_all.json");
    if (!res.ok) throw new Error("HTTP " + res.status);
    allPlays = await res.json();
    buildSeasonOptions(); // FIRST — week options depend on the season
    buildWeekOptions();
    update();
  } catch (err) {
    summaryEl.textContent = "Couldn't load the plays.";
    errorEl.hidden = false;
  }
}

function buildSeasonOptions() {
  const seasons = [...new Set(allPlays.map((p) => p.season))].sort(
    (a, b) => b - a,
  ); // newest first
  seasonFilter.innerHTML =
    seasons.map((s) => `<option value="${s}">${s}</option>`).join("") +
    `<option value="all">All seasons</option>`;
  seasonFilter.value = String(seasons[0]); // default: newest season (2026 if present)
}

function playsInSeason() {
  if (seasonFilter.value === "all") return allPlays;
  const s = Number(seasonFilter.value); // select values are strings!
  return allPlays.filter((p) => p.season === s);
}

function buildWeekOptions() {
  const weeks = [...new Set(playsInSeason().map((p) => p.week))].sort(
    (a, b) => a - b,
  );
  weekFilter.innerHTML =
    `<option value="all">All weeks</option>` +
    weeks.map((w) => `<option value="${w}">Week ${w}</option>`).join("");
  weekFilter.value = "all"; // reset — see below
}

// One pure filter: reads state + controls, returns a new array.
function currentPlays() {
  const season = seasonFilter.value;
  const week = weekFilter.value;
  const down = downFilter.value;
  const type = typeFilter.value;
  return allPlays.filter(
    (p) =>
      (season === "all" || p.season === Number(season)) &&
      (week === "all" || p.week === Number(week)) &&
      (down === "all" || p.down === Number(down)) &&
      (type === "all" || p.play_type === type),
  );
}

function update() {
  const plays = currentPlays();
  renderTable(plays);
  renderSummary(plays);
}

function renderTable(plays) {
  // Show the first 200 — enough to browse, kind to the DOM.
  playsBody.innerHTML = plays
    .slice(0, 200)
    .map(
      (p) => `
    <tr>
      <td>${p.week}</td>
      <td>${p.down} & ${p.distance}</td>
      <td>${p.yardline}</td>
      <td>${p.play_type}</td>
      <td>${p.yards}</td>
      <td class="${p.epa >= 0 ? "epa-pos" : "epa-neg"}">
        ${p.epa >= 0 ? "+" : ""}${p.epa.toFixed(2)}
      </td>
      <td>${p.success ? "✓" : "—"}</td>
      <td>${p.desc}</td>
    </tr>`,
    )
    .join("");
}

function renderSummary(plays) {
  if (!plays.length) {
    summaryEl.textContent = "No plays match those filters.";
    return;
  }
  const epa = plays.reduce((s, p) => s + p.epa, 0) / plays.length;
  const succ = plays.reduce((s, p) => s + p.success, 0) / plays.length;
  const seasonLabel =
    seasonFilter.value === "all" ? "All seasons" : seasonFilter.value;
  summaryEl.textContent = `${seasonLabel} · ${plays.length} plays · ${epa >= 0 ? "+" : ""}${epa.toFixed(3)} EPA/play · ${(succ * 100).toFixed(1)}% success`;
}

// Season changes rebuild the week list first, then update.
// The others only need update, because their options never change.
seasonFilter.addEventListener("change", () => {
  buildWeekOptions();
  update();
});

[weekFilter, downFilter, typeFilter].forEach((el) =>
  el.addEventListener("change", update),
);

loadPlays();
