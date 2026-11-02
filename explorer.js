// State: one pristine array. Everything else is derived.
let allPlays = [];

const weekFilter = document.querySelector("#weekFilter");
const downFilter = document.querySelector("#downFilter");
const typeFilter = document.querySelector("#typeFilter");
const playsBody  = document.querySelector("#playsBody");
const summaryEl  = document.querySelector("#summary");
const errorEl    = document.querySelector("#loadError");

async function loadPlays() {
  try {
    const res = await fetch("chiefs_plays_2024.json");
    if (!res.ok) throw new Error("HTTP " + res.status);
    allPlays = await res.json();
    buildWeekOptions();
    update();
  } catch (err) {
    summaryEl.textContent = "Couldn't load the plays.";
    errorEl.hidden = false;
  }
}

// Options from the data itself — no Week 6 can ever appear.
function buildWeekOptions() {
  const weeks = [...new Set(allPlays.map(p => p.week))]
    .sort((a, b) => a - b);
  weekFilter.innerHTML =
    '<option value="all">All weeks</option>' +
    weeks.map(w => `<option value="${w}">Week ${w}</option>`).join("");
}

// One pure filter: reads state + controls, returns a new array.
function currentPlays() {
  return allPlays.filter(p =>
    (weekFilter.value === "all" || p.week === Number(weekFilter.value)) &&
    (downFilter.value === "all" || p.down === Number(downFilter.value)) &&
    (typeFilter.value === "all" || p.play_type === typeFilter.value)
  );
}

function update() {
  const plays = currentPlays();
  renderTable(plays);
  renderSummary(plays);
}

function renderTable(plays) {
  // Show the first 200 — enough to browse, kind to the DOM.
  playsBody.innerHTML = plays.slice(0, 200).map(p => `
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
    </tr>`).join("");
}

function renderSummary(plays) {
  if (!plays.length) {
    summaryEl.textContent = "No plays match those filters.";
    return;
  }
  const epa = plays.reduce((s, p) => s + p.epa, 0) / plays.length;
  const succ = plays.reduce((s, p) => s + p.success, 0) / plays.length;
  summaryEl.textContent =
    `${plays.length} plays · ${epa >= 0 ? "+" : ""}${epa.toFixed(3)} EPA/play · ${(succ * 100).toFixed(1)}% success`;
}

[weekFilter, downFilter, typeFilter]
  .forEach(el => el.addEventListener("change", update));

loadPlays();