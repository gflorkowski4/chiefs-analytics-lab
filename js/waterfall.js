async function loadDrive() {
  const response = await fetch("chiefs_plays_all.json");
  const allPlays = await response.json();

  const drivePlays = allPlays
    .filter((p) => p.season === 2026 && p.week === 9 && p.drive === 4)
    .map((p) => ({
      down: p.down,
      distance: p.distance,
      yardline: p.yardline,
      yards: p.yards,
      epa: p.epa,
      success: p.success,
      label: p.desc,
      play_type: p.play_type,
      passer: p.passer,
      receiver: p.receiver,
      rusher: p.rusher,
      touchdown: p.touchdown,
      sack: p.sack,
      incomplete_pass: p.incomplete_pass,
      defteam: p.defteam,
      fumble: p.fumble,
      fumble_lost: p.fumble_lost,
    }));

  return drivePlays;
}


/* Human-readable play description, as in js/statStripe.js */
function playDescription(play) {
  if (play.play_type === "pass") {
    let line = `${play.passer} ${play.play_type} to ${play.receiver} for ${play.yards} YDS`;
    if (play.touchdown) {
      line += " TOUCHDOWN";
    }
    if (play.sack) {
      line = `${play.defteam} sacked ${play.passer} for ${play.yards} YDS`;
    }
    if (play.incomplete_pass) {
      line = `${play.passer} ${play.play_type} incomplete`;
    }
    return line;
  }
  if (play.play_type === "run") {
    let line = `${play.rusher} ${play.play_type} for ${play.yards} YDS`;
    if (play.touchdown) {
      line += " TOUCHDOWN";
    }
    if (play.fumble) {
      line += ", fumbled";
    }
    if (play.fumble_lost) {
      line += ` and recovered by ${play.defteam}.`;
    }
    return line;
  }
}

function renderField(drivePlays) {
  const field = document.getElementById("field");

  for (const play of drivePlays) {
    const spike = document.createElement("div");
    spike.classList.add("spike");
    spike.classList.add(play.epa >= 0 ? "spike--positive" : "spike--negative");
    spike.style.left = (100 - play.yardline) + "%";
    spike.style.height = (Math.abs(play.epa) / 2.44) * 50 + "%";
    spike.addEventListener("click", () => {
      openModal(play);
    });
    field.appendChild(spike);
  }
}

function openModal(play) {
  const modal = document.getElementById("modal");
  const content = document.getElementById("modalDetails");

  const before = play.totalAfterPlay - play.epa;
  const yardlineText =
    play.yardline > 50
      ? "KC " + (100 - play.yardline)
      : "NYJ " + play.yardline;

  content.innerHTML =
    "<h3>" +
    (playDescription(play) || "Play description not available") +
    "</h3>" +
    '<p class="modal__desc">' +
    play.label +
    "</p>" +
    "<p><strong>EPA:</strong> " + play.epa.toFixed(2) + "</p>" +
    "<p><strong>Down &amp; distance:</strong> " + play.down + " &amp; " + play.distance + "</p>" +
    "<p><strong>Yard line:</strong> " + yardlineText + "</p>" +
    "<p><strong>Yards gained:</strong> " + play.yards + "</p>" +
    "<p><strong>Success:</strong> " + (play.success ? "Yes" : "No") + "</p>" +
    "<p><strong>Running total:</strong> " + before.toFixed(2) + " → " + play.totalAfterPlay.toFixed(2) + "</p>";

  modal.hidden = false;
}

async function init() {
  const drivePlays = await loadDrive();

  let total = 0;
  for (const play of drivePlays) {
    total += play.epa;
    play.totalAfterPlay = total;
  }

  renderField(drivePlays);
}

document.getElementById("modalClose").addEventListener("click", () => {
  document.getElementById("modal").hidden = true;
});

init();
