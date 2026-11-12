/* ==========================================================
   CHIEFS ANALYTICS LAB — OPTION C PLAY EXPLORER

   All filters, statistics, and table pages derive
   from one source array.

   Production uses chiefs_plays_all.json.
   Preview uses synthetic data ONLY when
   body[data-source="demo"].
   ========================================================== */

/* 1. APPLICATION STATE */

let allPlays = [];
let filteredPlays = [];
let currentPage = 1;
let impact = "all";

const PAGE_SIZE = 25;

const byId = (id) => document.getElementById(id);

const seasonTypeFilter = byId("seasonTypeFilter");
const seasonFilter = byId("seasonFilter");
const weekFilter = byId("weekFilter");
const downFilter = byId("downFilter");
const typeFilter = byId("typeFilter");
const searchFilter = byId("searchFilter");
const sortFilter = byId("sortFilter");
const playsBody = byId("playsBody");

/* 2. FORMATTING HELPERS */

const fmtEPA = (value) => `${value >= 0 ? "+" : ""}${value.toFixed(3)}`;

const fmtPct = (value) => `${(value * 100).toFixed(1)}%`;

const fmtNum = (value) => value.toLocaleString("en-US");

function setText(id, value) {
  byId(id).textContent = value;
}

/* 3. NORMALIZE DATA

   Numeric strings are converted once.

   Only pass/run plays with a valid recorded down
   and the required metrics are included.
*/

function normalizePlay(p, index) {
  if (
    !p ||
    p.epa == null ||
    p.epa === "" ||
    p.success == null ||
    p.success === ""
  ) {
    return null;
  }

  const play = {
    id: index,
    season: Number(p.season),
    season_type: String(p.season_type || "").toUpperCase(),
    week: Number(p.week),
    down: Number(p.down),
    distance: p.distance ?? "—",
    yardline: p.yardline ?? "—",
    play_type: String(p.play_type || "").toLowerCase(),
    yards: Number(p.yards),
    epa: Number(p.epa),
    success: Number(p.success),
    desc: String(p.desc ?? "Description unavailable"),
  };

  const numericFields = [
    play.season,
    play.week,
    play.down,
    play.yards,
    play.epa,
    play.success,
  ];

  if (!numericFields.every(Number.isFinite)) {
    return null;
  }

  if (!["REG", "POST"].includes(play.season_type)) {
    return null;
  }

  if (!["pass", "run"].includes(play.play_type)) {
    return null;
  }

  if (play.down < 1 || play.down > 4 || play.week < 1) {
    return null;
  }

  return play;
}

/* 4. BUILD FILTER OPTIONS */

function option(value, label) {
  const el = document.createElement("option");

  el.value = String(value);
  el.textContent = label;

  return el;
}

function playsInType() {
  const type = seasonTypeFilter.value;

  return type === "all"
    ? allPlays
    : allPlays.filter((p) => p.season_type === type);
}

function playsInSeason() {
  const pool = playsInType();

  return seasonFilter.value === "all"
    ? pool
    : pool.filter((p) => p.season === Number(seasonFilter.value));
}

function buildSeasonOptions() {
  const seasons = [...new Set(playsInType().map((p) => p.season))].sort(
    (a, b) => b - a,
  );

  const previous = seasonFilter.value;

  seasonFilter.replaceChildren(
    ...seasons.map((s) => option(s, s)),
    option("all", "All seasons"),
  );

  seasonFilter.value =
    previous === "all" || seasons.includes(Number(previous))
      ? previous
      : String(seasons[0] ?? "all");
}

function buildWeekOptions() {
  const weeks = [...new Set(playsInSeason().map((p) => p.week))].sort(
    (a, b) => a - b,
  );

  const previous = weekFilter.value;

  weekFilter.replaceChildren(
    option("all", "All weeks"),
    ...weeks.map((w) => option(w, `Week ${w}`)),
  );

  weekFilter.value =
    weeks.includes(Number(previous)) && previous !== "all" ? previous : "all";
}

/* 5. FILTER THE PLAY DATA */

function currentPlays() {
  const q = searchFilter.value.trim().toLowerCase();

  return allPlays.filter(
    (p) =>
      (seasonTypeFilter.value === "all" ||
        p.season_type === seasonTypeFilter.value) &&
      (seasonFilter.value === "all" ||
        p.season === Number(seasonFilter.value)) &&
      (weekFilter.value === "all" || p.week === Number(weekFilter.value)) &&
      (downFilter.value === "all" || p.down === Number(downFilter.value)) &&
      (typeFilter.value === "all" || p.play_type === typeFilter.value) &&
      (impact === "all" || (impact === "positive" ? p.epa > 0 : p.epa < 0)) &&
      (!q || p.desc.toLowerCase().includes(q)),
  );
}

/* 6. SORT MATCHING PLAYS */

function sortedPlays(plays) {
  const arr = [...plays];

  if (sortFilter.value === "best") {
    arr.sort((a, b) => b.epa - a.epa || a.id - b.id);
  } else if (sortFilter.value === "worst") {
    arr.sort((a, b) => a.epa - b.epa || a.id - b.id);
  } else if (sortFilter.value === "yards") {
    arr.sort((a, b) => b.yards - a.yards || a.id - b.id);
  }

  return arr;
}

/* 7. CALCULATE SUMMARY STATISTICS */

function calcStats(plays) {
  if (!plays.length) {
    return null;
  }

  const sums = plays.reduce(
    (acc, p) => {
      acc.epa += p.epa;
      acc.success += p.success;
      acc.pass += p.play_type === "pass" ? 1 : 0;

      return acc;
    },
    {
      epa: 0,
      success: 0,
      pass: 0,
    },
  );

  return {
    count: plays.length,
    epa: sums.epa / plays.length,
    success: sums.success / plays.length,
    passRate: sums.pass / plays.length,
  };
}

/* 8. RENDER SUMMARY AND ANALYST NOTE */

function renderSummary(plays) {
  const stats = calcStats(plays);

  setText("statPlays", fmtNum(plays.length));

  setText("statEpa", stats ? fmtEPA(stats.epa) : "—");

  setText("statSuccess", stats ? fmtPct(stats.success) : "—");

  setText("statPassRate", stats ? fmtPct(stats.passRate) : "—");

  byId("statEpa").classList.toggle("epa-pos", !!stats && stats.epa >= 0);

  byId("statEpa").classList.toggle("epa-neg", !!stats && stats.epa < 0);

  const season =
    seasonFilter.value === "all" ? "All seasons" : seasonFilter.value;

  const seasonType =
    seasonTypeFilter.value === "all"
      ? "Regular season + playoffs"
      : seasonTypeFilter.value === "POST"
        ? "Playoffs"
        : "Regular season";

  const week =
    weekFilter.value === "all" ? "All weeks" : `Week ${weekFilter.value}`;

  setText("summaryScope", `${season} · ${seasonType} · ${week}`);

  if (!stats) {
    setText("insightTitle", "NO MATCHES FOUND");

    setText(
      "insightText",
      "No plays match this combination. Try removing " +
        "the search term, choosing another week, or " +
        "resetting the filters.",
    );

    return;
  }

  const adjective =
    stats.epa > 0.0005 ? "added" : stats.epa < -0.0005 ? "lost" : "changed";

  const direction =
    stats.epa > 0.0005
      ? "positive"
      : stats.epa < -0.0005
        ? "negative"
        : "near-zero";

  const countText = fmtNum(stats.count);

  setText("insightTitle", "ANALYST'S READ");

  setText(
    "insightText",
    `Across ${countText} matching plays, ` +
      `the offense ${adjective} ` +
      `${Math.abs(stats.epa).toFixed(3)} ` +
      `expected points per snap on average ` +
      `(${direction} EPA). ` +
      `${fmtPct(stats.success)} of these plays ` +
      `were marked successful; ` +
      `${fmtPct(stats.passRate)} were passes.`,
  );
}

/* 9. SAFELY CREATE TABLE CELLS

   Using textContent ensures that descriptions
   are treated as text rather than HTML.
*/

function cell(row, content, className) {
  const td = document.createElement("td");

  if (className) {
    td.className = className;
  }

  if (content != null) {
    td.textContent = String(content);
  }

  row.appendChild(td);

  return td;
}

/* 10. RENDER TABLE WITH PAGINATION */

function renderTable(plays) {
  const totalPages = Math.max(1, Math.ceil(plays.length / PAGE_SIZE));

  currentPage = Math.min(totalPages, Math.max(1, currentPage));

  const start = (currentPage - 1) * PAGE_SIZE;

  const pagePlays = plays.slice(start, start + PAGE_SIZE);

  const fragment = document.createDocumentFragment();

  if (!pagePlays.length) {
    const tr = document.createElement("tr");

    const td = cell(
      tr,
      "No plays found. Try broadening your filters.",
      "empty-row",
    );

    td.colSpan = 9;

    fragment.appendChild(tr);
  }

  for (const p of pagePlays) {
    const row = document.createElement("tr");

    /* SEASON / WEEK */
    const wk = cell(row, null, "table-week");

    wk.textContent = `W${p.week}`;

    const season = document.createElement("small");

    season.textContent = `${p.season} · ${p.season_type}`;

    wk.appendChild(season);

    /* DOWN AND DISTANCE */
    cell(row, `${p.down} & ${p.distance}`, "down-text");

    /* FIELD POSITION */
    cell(row, p.yardline);

    /* PLAY TYPE CHIP */
    const typeTd = cell(row, null);

    const chip = document.createElement("span");

    chip.className =
      `type-chip ` + (p.play_type === "run" ? "type-chip--run" : "");

    chip.textContent = p.play_type.toUpperCase();

    typeTd.appendChild(chip);

    /* YARDS */
    cell(row, p.yards, "yards");

    /* EPA NUMBER AND BAR */
    const epaCell = cell(row, null);

    const epaDisplay = document.createElement("div");

    epaDisplay.className = "epa-display";

    const epaValue = document.createElement("span");

    epaValue.className = p.epa >= 0 ? "epa-pos" : "epa-neg";

    epaValue.textContent = fmtEPA(p.epa);

    const bar = document.createElement("span");

    bar.className = `epa-bar ` + (p.epa < 0 ? "epa-bar--neg" : "");

    bar.style.width = `${Math.min((Math.abs(p.epa) / 3.5) * 100, 100)}%`;

    epaDisplay.append(epaValue, bar);

    epaCell.appendChild(epaDisplay);

    /* SUCCESS */
    const success = cell(
      row,
      p.success ? "✓ Yes" : "— No",
      p.success ? "success-yes" : "success-no",
    );

    success.setAttribute(
      "aria-label",
      p.success ? "Successful play" : "Unsuccessful play",
    );

    /* DESCRIPTION */
    cell(row, p.desc, "play-desc-cell");

    /* INSPECT PLAY BUTTON */
    const actionCell = cell(row, null);

    const inspect = document.createElement("button");

    inspect.type = "button";
    inspect.className = "inspect-button";

    inspect.textContent = "INSPECT ↗";

    inspect.setAttribute(
      "aria-label",
      `Inspect ${p.season} week ${p.week} play`,
    );

    inspect.addEventListener("click", () => showPlay(p));

    actionCell.appendChild(inspect);
    fragment.appendChild(row);
  }

  /* Replace old table rows with new rows */
  playsBody.replaceChildren(fragment);

  /* Table count */
  setText("resultCount", fmtNum(plays.length));

  /* Pagination status */
  const paginationText = plays.length
    ? `Showing ${fmtNum(start + 1)}–` +
      `${fmtNum(
        Math.min(start + PAGE_SIZE, plays.length),
      )} of ${fmtNum(plays.length)} matching plays`
    : "No matching plays";

  setText("paginationStatus", paginationText);

  setText("pageIndex", `${currentPage} / ${totalPages}`);

  byId("prevPage").disabled = currentPage <= 1;

  byId("nextPage").disabled = currentPage >= totalPages;
}

/* 11. UPDATE THE ENTIRE EXPLORER */

function update(resetPage = true) {
  if (resetPage) {
    currentPage = 1;
  }

  filteredPlays = sortedPlays(currentPlays());

  renderSummary(filteredPlays);
  renderTable(filteredPlays);
}

/* 12. PLAY INSPECTION DIALOG */

function showPlay(play) {
  setText(
    "dialogContext",
    `${play.season} · ` +
      `${play.season_type === "POST" ? "Playoffs" : "Regular season"} · ` +
      `Week ${play.week} · ` +
      `${play.down} & ${play.distance}`,
  );

  setText("dialogEpa", fmtEPA(play.epa));

  const abs = Math.abs(play.epa).toFixed(3);

  const interpretation =
    play.epa > 0
      ? `This play increased the offense's ` +
        `expected point value by ${abs} points ` +
        `relative to the pre-play situation.`
      : play.epa < 0
        ? `This play reduced the offense's ` +
          `expected point value by ${abs} points ` +
          `relative to the pre-play situation.`
        : `This play had approximately zero EPA ` +
          `relative to the pre-play situation.`;

  setText("dialogInterpretation", interpretation);

  const score = byId("dialogEpa").parentElement;

  score.classList.toggle("is-negative", play.epa < 0);

  setText("dialogType", play.play_type.toUpperCase());

  setText("dialogYards", play.yards);

  setText("dialogSuccess", play.success ? "YES" : "NO");

  setText("dialogField", play.yardline);

  setText("dialogDescription", play.desc);

  byId("playDialog").showModal();
}

/* 13. EPA IMPACT FILTER */

function setImpact(value) {
  impact = value;

  document.querySelectorAll(".impact-tab").forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.impact === value),
    );
  });
}

/* 14. OPTIONAL SYNTHETIC PREVIEW DATA

   Used only when the body has:
   data-source="demo"

   Production explorer.html uses:
   data-source="production"
*/

function makeDemoData() {
  const phrases = [
    "Patrick Mahomes pass short middle to receiver for a first down",
    "Patrick Mahomes pass deep right, complete for 28 yards",
    "Hand-off up the middle, gain on first and ten",
    "Pass incomplete on a deep sideline attempt",
    "Run off left tackle for a short gain",
    "Patrick Mahomes scrambles on third down",
    "Pass short left, catch and run down the sideline",
    "Sack on second down, loss of yardage",
    "Rush up the middle on third and short",
    "Play-action pass to the right for a touchdown",
    "Pass across the middle, tackled shy of the marker",
    "Outside zone run to the right",
  ];

  const data = [];

  for (const [season, maxWeek] of [
    [2024, 18],
    [2025, 17],
    [2026, 9],
  ]) {
    for (let w = 1; w <= maxWeek; w++) {
      for (let i = 0; i < 19; i++) {
        const pass = (i * 7 + w) % 10 < 7;

        const swing = Math.sin(i * 2.17 + w * 0.91 + season * 0.15);

        const epa =
          (season === 2026 ? 0.11 : 0.03) +
          0.73 * swing +
          0.11 * Math.cos(w * 0.8);

        data.push({
          season,
          season_type: "REG",
          week: w,
          down: 1 + (i % 4),
          distance: 1 + ((i * 3 + w) % 15),
          yardline: `KC ${10 + ((i * 7 + w) % 78)}`,
          play_type: pass ? "pass" : "run",
          yards: Math.round(4 + 15 * swing + 3 * Math.cos(i)),
          epa,
          success: Number((i * 7 + w) % 19 < 9),
          desc: phrases[(i * 5 + w) % phrases.length],
        });
      }
    }

    /* Example playoff plays */
    if (season !== 2026) {
      for (let i = 0; i < 15; i++) {
        data.push({
          season,
          season_type: "POST",
          week: 19,
          down: 1 + (i % 4),
          distance: 1 + (i % 12),
          yardline: `KC ${12 + i * 4}`,
          play_type: i % 4 ? "pass" : "run",
          yards: 5 + (i % 22),
          epa: 0.25 * Math.sin(i * 1.8),
          success: Number(i % 2 === 0),
          desc: phrases[i % phrases.length],
        });
      }
    }
  }

  return data;
}

/* 15. LOAD JSON AND INITIALIZE */

async function loadPlays() {
  try {
    const demo = document.body.dataset.source === "demo";

    let data;

    if (demo) {
      data = makeDemoData();
    } else {
      const res = await fetch("chiefs_plays_all.json");

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      data = await res.json();
    }

    if (!Array.isArray(data)) {
      throw new Error("Expected a JSON array of plays");
    }

    allPlays = data.map(normalizePlay).filter(Boolean);

    if (!allPlays.length) {
      throw new Error("No valid pass/run plays with a down were found");
    }

    buildSeasonOptions();
    buildWeekOptions();
    update();

    setText(
      "datasetNote",
      `${
        demo
          ? "DEMO: Synthetic values, not actual Chiefs results"
          : "Source: chiefs_plays_all.json"
      } · ` +
        `${fmtNum(allPlays.length)} valid pass/run ` +
        `plays with a recorded down. ` +
        `Metrics use all matches; the table displays ` +
        `${PAGE_SIZE} plays per page.`,
    );
  } catch (error) {
    console.error("Could not load Explorer data", error);

    setText("summaryScope", "Unable to load plays");

    byId("loadError").hidden = false;

    byId("loadError").textContent += ` (${error.message})`;

    setText("insightTitle", "DATA UNAVAILABLE");

    setText(
      "insightText",
      "Check that your data file is in the " +
        "project root and open the site through Live Server.",
    );

    setText("paginationStatus", "No data loaded");

    setText("resultCount", "0");
  }
}

/* 16. EVENT LISTENERS */

/* Season type changes which seasons exist */

seasonTypeFilter.addEventListener("change", () => {
  buildSeasonOptions();
  buildWeekOptions();
  update();
});

/* Season changes available weeks */

seasonFilter.addEventListener("change", () => {
  buildWeekOptions();
  update();
});

/* Standard filters and sorting */

[weekFilter, downFilter, typeFilter, sortFilter].forEach((el) =>
  el.addEventListener("change", () => update()),
);

/* Live search */

searchFilter.addEventListener("input", () => update());

/* Positive / negative EPA buttons */

document.querySelectorAll(".impact-tab").forEach((button) =>
  button.addEventListener("click", () => {
    setImpact(button.dataset.impact);
    update();
  }),
);

/* Reset all filters */

byId("resetFilters").addEventListener("click", () => {
  seasonTypeFilter.value = "REG";
  seasonFilter.value = "";

  buildSeasonOptions();

  weekFilter.value = "all";
  buildWeekOptions();

  downFilter.value = "all";
  typeFilter.value = "all";
  searchFilter.value = "";
  sortFilter.value = "original";

  setImpact("all");
  update();
});

/* Previous page */

byId("prevPage").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderTable(filteredPlays);
  }
});

/* Next page */

byId("nextPage").addEventListener("click", () => {
  const totalPages = Math.ceil(filteredPlays.length / PAGE_SIZE);

  if (currentPage < totalPages) {
    currentPage++;
    renderTable(filteredPlays);
  }
});

/* Close dialog buttons */

["closeDialog", "closeDialogBottom"].forEach((id) =>
  byId(id).addEventListener("click", () => byId("playDialog").close()),
);

/* Close dialog on backdrop click */

byId("playDialog").addEventListener("click", (event) => {
  if (event.target === byId("playDialog")) {
    byId("playDialog").close();
  }
});

/* START THE EXPLORER */

loadPlays();
