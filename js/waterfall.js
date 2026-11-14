console.log("waterfall.js loaded");

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
    }));

  return drivePlays;
}

function renderField(drivePlays) {
  const field = document.getElementById("field");

  for (const play of drivePlays) {
    const spike = document.createElement("div");
    spike.classList.add("spike");
    spike.classList.add(play.epa >= 0 ? "spike--positive" : "spike--negative");
    spike.style.left = (100 - play.yardline) + "%";
    spike.style.height = Math.abs(play.epa) / 2.44 * 100 + "%";
    spike.addEventListener("click", () => {
      openModal(play);
    });
    field.appendChild(spike);
  }
}

function openModal(play) {
  const modal = document.getElementById("modal");
  const content = document.getElementById("modalContent");

  const before = play.totalAfterPlay - play.epa;
  const yardlineText =
    play.yardline > 50
      ? "KC " + (100 - play.yardline)
      : "NYJ " + play.yardline;

  content.innerHTML =
    "<h3>" + play.label + "</h3>" +
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
