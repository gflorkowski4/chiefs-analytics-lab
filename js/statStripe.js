
/* ==========================================================
   CHIEFS ANALYTICS LAB — OPTION C
   Live season dashboard + weekly EPA chart
   ========================================================== */

/* GLOBAL STATE */

let allPlays = [];
let selectedWeek = null;

const SEASON = 2026;

/* HELPERS */

const $ = id => document.getElementById(id);

const fmtEPA = n =>
  (n >= 0 ? "+" : "") + n.toFixed(3);

const fmtPct = n =>
  (n * 100).toFixed(1) + "%";

const fmtInt = n =>
  n.toLocaleString("en-US");

/* ==========================================================
   1. DATA VALIDATION
   ========================================================== */

function isValidPlay(p) {
  return (
    p &&
    p.epa !== null &&
    p.epa !== "" &&
    p.success !== null &&
    p.success !== "" &&
    p.week !== null &&
    p.week !== "" &&
    Number.isFinite(Number(p.epa)) &&
    Number.isFinite(Number(p.success)) &&
    Number.isFinite(Number(p.week))
  );
}

/* ==========================================================
   2. FILTERING AND STATISTICS
   ========================================================== */

function latestWeek(plays, season) {
  const reg = plays.filter(
    p =>
      Number(p.season) === season &&
      p.season_type === "REG" &&
      isValidPlay(p)
  );

  return reg.reduce(
    (max, p) => Math.max(max, Number(p.week)),
    0
  );
}

function weekPool(plays, season, week) {
  return plays.filter(
    p =>
      Number(p.season) === season &&
      p.season_type === "REG" &&
      Number(p.week) === week &&
      isValidPlay(p)
  );
}

function weekStats(plays, season, week) {
  const pool = weekPool(plays, season, week);

  if (pool.length === 0) {
    return null;
  }

  const totalEPA = pool.reduce(
    (sum, p) => sum + Number(p.epa),
    0
  );

  const successes = pool.reduce(
    (sum, p) => sum + Number(p.success),
    0
  );

  return {
    plays: pool.length,
    epaPlay: totalEPA / pool.length,
    success: successes / pool.length
  };
}

function seasonPool(plays, season) {
  return plays.filter(
    p =>
      Number(p.season) === season &&
      p.season_type === "REG" &&
      isValidPlay(p)
  );
}

function seasonStats(plays, season) {
  const pool = seasonPool(plays, season);

  if (!pool.length) {
    return null;
  }

  const totalEPA = pool.reduce(
    (sum, p) => sum + Number(p.epa),
    0
  );

  const successes = pool.reduce(
    (sum, p) => sum + Number(p.success),
    0
  );

  return {
    plays: pool.length,
    epaPlay: totalEPA / pool.length,
    success: successes / pool.length
  };
}

/* ==========================================================
   3. DOM UPDATE HELPERS
   ========================================================== */

function setText(id, text) {
  const node = $(id);

  if (node) {
    node.textContent = text;
  }
}

function setPolarity(node, number) {
  if (!node) {
    return;
  }

  node.classList.toggle(
    "is-positive",
    number >= 0
  );

  node.classList.toggle(
    "is-negative",
    number < 0
  );
}

/* ==========================================================
   4. RENDER SEASON SNAPSHOT
   ========================================================== */

function renderSeason(plays) {
  const stats = seasonStats(plays, SEASON);

  if (!stats) {
    return;
  }

  const last = latestWeek(plays, SEASON);

  setText(
    "season-epa",
    fmtEPA(stats.epaPlay)
  );

  setText(
    "season-success",
    fmtPct(stats.success)
  );

  setText(
    "season-plays",
    fmtInt(stats.plays)
  );

  setText(
    "season-context",
    `2026 regular season · Through Week ${last} · Pass + run plays`
  );

  setText(
    "season-epa-label",
    stats.epaPlay >= 0
      ? "POSITIVE EPA"
      : "NEGATIVE EPA"
  );

  setPolarity(
    $("season-epa"),
    stats.epaPlay
  );

  $("season-epa-label").classList.toggle(
    "is-negative",
    stats.epaPlay < 0
  );
}

/* ==========================================================
   5. RENDER WEEKLY PULSE
   ========================================================== */

function renderPulse(week, stats, best, worst) {
  setText(
    "pulse-title",
    `WEEK ${week} · KEY STATS`
  );

  setText(
    "pulse-subtitle",
    `2026 regular season · Week ${week} · Pass and run plays`
  );

  setText(
    "pulse-epa",
    fmtEPA(stats.epaPlay)
  );

  setText(
    "pulse-success",
    fmtPct(stats.success)
  );

  setText(
    "pulse-plays",
    fmtInt(stats.plays)
  );

  setText(
    "pulse-best",
    fmtEPA(Number(best.epa))
  );

  setText(
    "pulse-best-desc",
    best.desc || "Play description not available in the dataset."
  );

  setText(
    "pulse-worst",
    fmtEPA(Number(worst.epa))
  );

  setText(
    "pulse-worst-desc",
    worst.desc || "Play description not available in the dataset."
  );

  setPolarity(
    $("pulse-epa"),
    stats.epaPlay
  );
}

/* ==========================================================
   6. ANALYST NOTE
   ========================================================== */

function updateAnalystNote(
  week,
  weekData,
  fullSeason
) {
  const delta =
    weekData.epaPlay - fullSeason.epaPlay;

  const result =
    weekData.epaPlay >= 0
      ? "added"
      : "lost";

  const compare =
    Math.abs(delta) < 0.0005
      ? "roughly in line with"
      : delta > 0
        ? "above"
        : "below";

  const qualifier =
    compare === "roughly in line with"
      ? compare
      : `${Math.abs(delta).toFixed(3)} EPA/play ${compare}`;

  setText(
    "analyst-note",
    `In Week ${week}, the offense ${result} ` +
      `${Math.abs(weekData.epaPlay).toFixed(3)} ` +
      `expected points per play on average. ` +
      `That was ${qualifier} its 2026 regular-season ` +
      `average of ${fmtEPA(fullSeason.epaPlay)}. ` +
      `The top and bottom plays above show how ` +
      `individual moments shaped that result.`
  );
}

/* ==========================================================
   7. GENERATE WEEKLY DATA SERIES
   ========================================================== */

function weeklySeries(plays) {
  const weeks = [
    ...new Set(
      seasonPool(plays, SEASON).map(
        p => Number(p.week)
      )
    )
  ].sort((a, b) => a - b);

  return weeks.map(
    week => ({
      week,
      ...weekStats(plays, SEASON, week)
    })
  );
}

/* ==========================================================
   8. SVG HELPER
   ========================================================== */

function addSvg(parent, name, attrs, content) {
  const node = document.createElementNS(
    "http://www.w3.org/2000/svg",
    name
  );

  Object.entries(attrs || {}).forEach(
    ([key, val]) => {
      node.setAttribute(
        key,
        String(val)
      );
    }
  );

  if (content != null) {
    node.textContent = content;
  }

  parent.appendChild(node);

  return node;
}

/* ==========================================================
   9. RENDER WEEKLY EPA CHART
   ========================================================== */

function renderChart(series, currentWeek) {
  const svg = $("weekly-chart");

  svg.replaceChildren();

  if (!series.length) {
    return;
  }

  const width = 780;
  const left = 55;
  const right = 22;
  const top = 20;
  const bottom = 198;

  const values = series.map(
    s => s.epaPlay
  );

  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);

  const padding = Math.max(
    (max - min) * 0.19,
    0.045
  );

  const low = min - padding;
  const high = max + padding;

  const x = i =>
    left +
    (i * (width - left - right)) /
      Math.max(series.length - 1, 1);

  const y = value =>
    top +
    ((high - value) / (high - low)) *
      (bottom - top);

  /* Create SVG gradient */

  const defs = addSvg(
    svg,
    "defs"
  );

  const gradient = addSvg(
    defs,
    "linearGradient",
    {
      id: "areaGradient",
      x1: "0",
      y1: "0",
      x2: "0",
      y2: "1"
    }
  );

  addSvg(
    gradient,
    "stop",
    {
      offset: "0%",
      "stop-color": "#ffb81c",
      "stop-opacity": ".24"
    }
  );

  addSvg(
    gradient,
    "stop",
    {
      offset: "100%",
      "stop-color": "#ffb81c",
      "stop-opacity": "0"
    }
  );

  /* Horizontal grid lines and axis labels */

  for (let i = 0; i <= 4; i++) {
    const value =
      high - ((high - low) * i) / 4;

    const yy = y(value);

    addSvg(
      svg,
      "line",
      {
        x1: left,
        y1: yy,
        x2: width - right,
        y2: yy,
        class: "grid-line"
      }
    );

    addSvg(
      svg,
      "text",
      {
        x: 5,
        y: yy + 4
      },
      (value >= 0 ? "+" : "") +
        value.toFixed(2)
    );
  }

  /* Zero-EPA reference line */

  if (low <= 0 && high >= 0) {
    addSvg(
      svg,
      "line",
      {
        x1: left,
        y1: y(0),
        x2: width - right,
        y2: y(0),
        class: "zero-line"
      }
    );
  }

  /* Build SVG path */

  const line = series
    .map(
      (s, i) =>
        `${i === 0 ? "M" : "L"}` +
        `${x(i).toFixed(1)},` +
        `${y(s.epaPlay).toFixed(1)}`
    )
    .join(" ");

  const area =
    `${line} ` +
    `L${x(series.length - 1)},${bottom} ` +
    `L${x(0)},${bottom} Z`;

  /* Shaded area */

  addSvg(
    svg,
    "path",
    {
      d: area,
      class: "trend-fill"
    }
  );

  /* Main trend line */

  addSvg(
    svg,
    "path",
    {
      d: line,
      class: "trend-line"
    }
  );

  /* Data points */

  series.forEach((s, i) => {
    const circle = addSvg(
      svg,
      "circle",
      {
        cx: x(i),
        cy: y(s.epaPlay),
        r: s.week === currentWeek ? 6 : 4,
        class:
          "trend-dot" +
          (s.week === currentWeek
            ? " is-selected"
            : "")
      }
    );

    addSvg(
      circle,
      "title",
      {},
      `Week ${s.week}: ${fmtEPA(s.epaPlay)} EPA per play`
    );
  });

  /* Accessible description */

  svg.setAttribute(
    "aria-label",
    "2026 regular season EPA per play by week: " +
      series
        .map(
          s =>
            `Week ${s.week} ${fmtEPA(s.epaPlay)}`
        )
        .join(", ") +
      "."
  );
}

/* ==========================================================
   10. INTERACTIVE WEEK BUTTONS
   ========================================================== */

function renderWeekControls(series, plays) {
  const controls = $("week-controls");

  controls.replaceChildren();

  series.forEach(({ week }) => {
    const button =
      document.createElement("button");

    button.type = "button";
    button.className = "week-control";
    button.textContent = `W${week}`;

    button.setAttribute(
      "aria-label",
      `Show Week ${week} statistics`
    );

    button.setAttribute(
      "aria-pressed",
      String(week === selectedWeek)
    );

    button.addEventListener(
      "click",
      () => {
        selectedWeek = week;

        updatePulse(plays, week);
        renderChart(series, week);

        controls
          .querySelectorAll("button")
          .forEach(el => {
            el.setAttribute(
              "aria-pressed",
              String(el === button)
            );
          });
      }
    );

    controls.appendChild(button);
  });
}

/* ==========================================================
   11. UPDATE WEEKLY DASHBOARD
   ========================================================== */

function updatePulse(
  plays,
  week = latestWeek(plays, SEASON)
) {
  const pool = weekPool(
    plays,
    SEASON,
    week
  );

  const stats = weekStats(
    plays,
    SEASON,
    week
  );

  if (!stats) {
    return;
  }

  const best = pool.reduce(
    (current, p) =>
      Number(p.epa) > Number(current.epa)
        ? p
        : current
  );

  const worst = pool.reduce(
    (current, p) =>
      Number(p.epa) < Number(current.epa)
        ? p
        : current
  );

  renderPulse(
    week,
    stats,
    best,
    worst
  );

  setText(
    "chart-selected-label",
    `· W${week} ${fmtEPA(stats.epaPlay)}`
  );

  const entireSeason = seasonStats(
    plays,
    SEASON
  );

  if (entireSeason) {
    updateAnalystNote(
      week,
      stats,
      entireSeason
    );
  }
}

/* ==========================================================
   12. ERROR HANDLING
   ========================================================== */

function showError(message) {
  setText(
    "season-context",
    message
  );

  setText(
    "pulse-title",
    "DATA UNAVAILABLE"
  );

  setText(
    "pulse-subtitle",
    "Check the data file and launch instructions."
  );

  setText(
    "chart-caption",
    message
  );

  setText(
    "analyst-note",
    "Place chiefs_plays_all.json next to index.html " +
      "and serve the folder through a local HTTP server. " +
      "Then reload the page."
  );
}

/* ==========================================================
   13. PREVIEW DATA (OPTIONAL)
   ========================================================== */

function makePreviewData() {
  // Synthetic data for preview.html only.
  // index.html always loads the real JSON.

  const base = [
    0.12,
    0.19,
    -0.03,
    0.17,
    0.08,
    0.21,
    0.05,
    0.11,
    0.28
  ];

  const counts = [
    52, 54, 54,
    52, 55, 51,
    56, 54, 56
  ];

  const descriptions = [
    "Pass over the middle on 3rd & 7 · first down",
    "Run between the tackles on 2nd & 5",
    "Deep completion on 1st & 10",
    "Short pass on 3rd & 11 · tackled short",
    "Outside run on 2nd & 2",
    "Incomplete pass on 2nd & 8"
  ];

  const demo = [];

  counts.forEach((count, w) => {
    for (let i = 0; i < count; i++) {
      const oscillation =
        0.64 * Math.sin(i * 2.23 + w * 0.89);

      const success =
        ((i * 7 + w * 5) % count) <
        Math.round(count * 0.49)
          ? 1
          : 0;

      demo.push({
        season: SEASON,
        season_type: "REG",
        week: w + 1,
        epa: base[w] + oscillation,
        success,
        desc:
          descriptions[
            (i + w) % descriptions.length
          ]
      });
    }
  });

  return demo;
}

/* ==========================================================
   14. LOAD JSON AND INITIALIZE
   ========================================================== */

async function loadPlays() {
  try {
    if (
      document.body.dataset.mode === "preview"
    ) {
      allPlays = makePreviewData();
    } else {
      const res = await fetch(
        "chiefs_plays_all.json"
      );

      if (!res.ok) {
        throw new Error(
          `HTTP ${res.status}`
        );
      }

      const data = await res.json();

      if (!Array.isArray(data)) {
        throw new Error(
          "Expected a JSON array of plays"
        );
      }

      allPlays = data;
    }

    /* Validate available season */

    if (!seasonStats(allPlays, SEASON)) {
      throw new Error(
        "No valid 2026 regular-season plays found"
      );
    }

    /* Season dashboard */

    renderSeason(allPlays);

    /* Latest weekly statistics */

    selectedWeek = latestWeek(
      allPlays,
      SEASON
    );

    updatePulse(
      allPlays,
      selectedWeek
    );

    /* Weekly EPA chart */

    const series = weeklySeries(
      allPlays
    );

    renderChart(
      series,
      selectedWeek
    );

    /* Week-selection buttons */

    renderWeekControls(
      series,
      allPlays
    );
  } catch (err) {
    console.error(
      "Could not load Chiefs plays:",
      err
    );

    showError(
      `Could not load play data (${err.message}).`
    );
  }
}

/* START APPLICATION */

loadPlays();
