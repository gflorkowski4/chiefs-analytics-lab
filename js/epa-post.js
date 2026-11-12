
"use strict";

/* ==========================================================
   CHIEFS ANALYTICS LAB — EPA ARTICLE

   Article-specific data and interactive examples.

   Future articles can have their own JavaScript file.
   The shared post.css does not need to change.
   ========================================================== */


/* ==========================================================
   1. OPENING DRIVE DATA
   ========================================================== */

const DRIVE = [
  {
    n: 1,
    desc: "Mahomes hits Rice for 11 yards",
    note: "",
    epa: 0.70
  },
  {
    n: 2,
    desc: "Mahomes takes a sack",
    note: "",
    epa: -0.48
  },
  {
    n: 3,
    desc: "Pacheco gains 4 on 2nd down",
    note: "A 4-yard gain does not always add expected points.",
    epa: -0.54
  },
  {
    n: 4,
    desc: "Mahomes converts 3rd-and-6 for 16",
    note: "Highest EPA of this drive.",
    epa: 3.20
  },
  {
    n: 5,
    desc: "Worthy scores from 21 yards out",
    note: "Touchdown.",
    epa: 2.19
  }
];


/* ==========================================================
   2. WEEKLY EPA DATA
   ========================================================== */

const WEEKLY = [
  { week: 1, epa: 0.124, plays: 70 },
  { week: 2, epa: -0.006, plays: 78 },
  { week: 3, epa: 0.086, plays: 87 },
  { week: 4, epa: -0.104, plays: 75 },
  { week: 5, epa: 0.094, plays: 97 },
  { week: 6, epa: null, plays: null },
  { week: 7, epa: 0.053, plays: 84 },
  { week: 8, epa: 0.072, plays: 85 },
  { week: 9, epa: 0.141, plays: 100 },
  { week: 10, epa: 0.019, plays: 80 },
  { week: 11, epa: 0.042, plays: 69 },
  { week: 12, epa: 0.244, plays: 89 },
  { week: 13, epa: -0.034, plays: 89 },
  { week: 14, epa: 0.091, plays: 86 },
  { week: 15, epa: -0.079, plays: 92 },
  { week: 16, epa: 0.106, plays: 86 },
  { week: 17, epa: 0.192, plays: 76 },
  { week: 18, epa: -0.310, plays: 49 }
];


/* ==========================================================
   3. HELPER FUNCTIONS
   ========================================================== */

const $ = id =>
  document.getElementById(id);

/* Add a sign and format an EPA value */

const signed = (n, decimals = 2) =>
  `${n < 0 ? "−" : "+"}${Math.abs(n).toFixed(decimals)}`;


/* Create an HTML element */

const node = (tag, className, text) => {
  const el = document.createElement(tag);

  if (className) {
    el.className = className;
  }

  if (text !== undefined) {
    el.textContent = text;
  }

  return el;
};


/* Create an SVG element */

const svgNode = (tag, attrs = {}, text) => {
  const el = document.createElementNS(
    "http://www.w3.org/2000/svg",
    tag
  );

  for (const [name, value] of Object.entries(attrs)) {
    el.setAttribute(name, String(value));
  }

  if (text !== undefined) {
    el.textContent = text;
  }

  return el;
};


/* ==========================================================
   4. BUILD INTERACTIVE DRIVE
   ========================================================== */

function buildDrive() {
  const list = $("play-list");

  if (!list) {
    return;
  }

  /* Determine EPA chart bounds */

  const min = Math.min(
    -0.7,
    ...DRIVE.map(p => p.epa)
  );

  const max = Math.max(
    3.2,
    ...DRIVE.map(p => p.epa)
  );

  const percent = value =>
    ((value - min) / (max - min)) * 100;

  const zero = percent(0);

  /* Store running totals */

  const cumulative = [];

  let running = 0;

  DRIVE.forEach((play, index) => {
    running += play.epa;
    cumulative.push(running);

    /* Create play button */

    const btn = node(
      "button",
      "post-drive__play"
    );

    btn.type = "button";

    btn.setAttribute(
      "aria-pressed",
      String(index === DRIVE.length - 1)
    );

    /* Play number */

    btn.append(
      node(
        "span",
        "post-drive__num",
        String(play.n)
      )
    );

    /* Play description and optional note */

    const detail = node(
      "span",
      "post-drive__detail"
    );

    detail.append(
      node(
        "span",
        "post-drive__desc",
        play.desc
      )
    );

    if (play.note) {
      detail.append(
        node(
          "span",
          "post-drive__note",
          play.note
        )
      );
    }

    btn.append(detail);

    /* Individual EPA value */

    const epaClass =
      play.epa >= 0
        ? "is-positive"
        : "is-negative";

    btn.append(
      node(
        "strong",
        `post-drive__epa ${epaClass}`,
        signed(play.epa)
      )
    );

    /* EPA bar row */

    const barRow = node(
      "span",
      "post-drive__bar-row"
    );

    barRow.setAttribute(
      "aria-hidden",
      "true"
    );

    const track = node(
      "span",
      "post-drive__bar-track"
    );

    track.style.setProperty(
      "--zero-pos",
      `${zero}%`
    );

    track.append(
      node(
        "span",
        "post-drive__bar-zero"
      )
    );

    /* Calculate bar placement */

    const fill = node(
      "span",
      `post-drive__bar-fill ${epaClass}`
    );

    fill.style.left =
      `${Math.min(
        zero,
        percent(play.epa)
      )}%`;

    fill.style.width =
      `${Math.abs(
        percent(play.epa) - zero
      )}%`;

    track.append(fill);

    const signLabel =
      play.epa >= 0
        ? "POSITIVE EPA"
        : "NEGATIVE EPA";

    barRow.append(
      track,
      node(
        "span",
        "post-drive__sign",
        signLabel
      )
    );

    btn.append(barRow);

    /* Update cumulative value on click */

    btn.addEventListener("click", () => {
      for (
        const b of list.querySelectorAll("button")
      ) {
        b.setAttribute(
          "aria-pressed",
          String(b === btn)
        );
      }

      $("cumulative-play").textContent =
        String(play.n);

      $("cumulative-value").textContent =
        signed(cumulative[index]);
    });

    list.append(btn);
  });

  /* Update footer totals */

  $("drive-total").textContent =
    signed(running);

  $("drive-positive-count").textContent =
    `${DRIVE.filter(p => p.epa > 0).length} ` +
    `of ${DRIVE.length} plays with positive EPA`;

  $("cumulative-play").textContent =
    String(DRIVE.length);

  $("cumulative-value").textContent =
    signed(running);
}


/* ==========================================================
   5. BUILD THE WEEKLY EPA CHART
   ========================================================== */

function buildChart() {
  const host = $("chart-wrap");

  if (!host) {
    return;
  }

  /* SVG dimensions */

  const W = 760;
  const H = 320;

  const left = 52;
  const right = 16;
  const top = 25;
  const bottom = 48;

  const plotW = W - left - right;
  const plotH = H - top - bottom;

  /* EPA axis limits */

  const min = -0.35;
  const max = 0.30;

  const y = value =>
    top +
    ((max - value) / (max - min)) * plotH;

  const zeroY = y(0);

  const slotW = plotW / WEEKLY.length;
  const barW = Math.min(27, slotW * 0.68);

  /* Create SVG */

  const svg = svgNode("svg", {
    viewBox: `0 0 ${W} ${H}`,
    role: "img",
    "aria-label":
      "2024 Chiefs EPA per play by week. " +
      "Week 12 best plus 0.244; " +
      "Week 18 worst minus 0.310; " +
      "Week 6 bye and no recorded EPA."
  });

  svg.append(
    svgNode(
      "title",
      {},
      "Chiefs EPA per play by week, 2024 regular season"
    )
  );

  /* ========================================================
     Draw horizontal grid lines
     ======================================================== */

  [
    -0.3,
    -0.2,
    -0.1,
    0,
    0.1,
    0.2,
    0.3
  ].forEach(tick => {
    const yy = y(tick);

    svg.append(
      svgNode("line", {
        x1: left,
        x2: W - right,
        y1: yy,
        y2: yy,
        class:
          tick === 0
            ? "post-chart__zero"
            : "post-chart__grid"
      })
    );

    svg.append(
      svgNode(
        "text",
        {
          x: left - 10,
          y: yy + 4,
          "text-anchor": "end",
          class: "post-chart__axis-label"
        },
        tick === 0
          ? "0"
          : signed(tick, 1)
      )
    );
  });

  /* ========================================================
     Draw each weekly EPA bar
     ======================================================== */

  WEEKLY.forEach((record, index) => {
    const centerX =
      left + slotW * (index + 0.5);

    /* Bye week: no bar */

    if (record.epa === null) {
      svg.append(
        svgNode(
          "text",
          {
            x: centerX,
            y: zeroY - 11,
            "text-anchor": "middle",
            class: "post-chart__bye"
          },
          "BYE"
        )
      );
    } else {
      const py = y(record.epa);

      /* Highlight best and negative weeks */

      let barClass;

      if (record.week === 12) {
        barClass =
          "post-chart__bar post-chart__bar--best";
      } else if (record.epa < 0) {
        barClass =
          "post-chart__bar post-chart__bar--negative";
      } else {
        barClass =
          "post-chart__bar post-chart__bar--positive";
      }

      const bar = svgNode("rect", {
        x: centerX - barW / 2,
        y: Math.min(py, zeroY),
        width: barW,
        height: Math.max(
          1,
          Math.abs(py - zeroY)
        ),
        rx: 3,
        class: barClass
      });

      /* Tooltip for each bar */

      bar.append(
        svgNode(
          "title",
          {},
          `Week ${record.week}: ` +
          `${signed(record.epa, 3)} EPA/play, ` +
          `${record.plays} plays`
        )
      );

      svg.append(bar);
    }

    /* Week label */

    svg.append(
      svgNode(
        "text",
        {
          x: centerX,
          y: H - bottom + 21,
          "text-anchor": "middle",
          class: "post-chart__axis-label"
        },
        String(record.week)
      )
    );
  });

  /* X-axis label */

  svg.append(
    svgNode(
      "text",
      {
        x: W / 2,
        y: H - 4,
        "text-anchor": "middle",
        class: "post-chart__axis-label"
      },
      "WEEK"
    )
  );

  /* Render chart */

  host.replaceChildren(svg);
}


/* ==========================================================
   6. BUILD THE ACCESSIBLE WEEKLY TABLE
   ========================================================== */

function buildWeeklyTable() {
  const body = document.querySelector(
    "#week-table tbody"
  );

  if (!body) {
    return;
  }

  for (const record of WEEKLY) {
    let rowClass = "";

    if (record.epa === null) {
      rowClass = "post-table__bye";
    } else if (record.week === 12) {
      rowClass = "post-table__best";
    }

    const tr = node(
      "tr",
      rowClass
    );

    /* Week heading */

    const week =
      `Week ${record.week}` +
      (
        record.week === 12
          ? " · Best"
          : record.week === 18
            ? " · Worst"
            : ""
      );

    tr.append(
      node(
        "th",
        "",
        week
      )
    );

    tr.lastChild.scope = "row";

    /* EPA per play */

    tr.append(
      node(
        "td",
        "post-table__number",
        record.epa === null
          ? "Bye"
          : signed(record.epa, 3)
      )
    );

    /* Total plays */

    tr.append(
      node(
        "td",
        "post-table__number",
        record.plays === null
          ? "—"
          : String(record.plays)
      )
    );

    body.append(tr);
  }
}


/* ==========================================================
   7. INITIALIZE THE ARTICLE
   ========================================================== */

buildDrive();
buildChart();
buildWeeklyTable();
