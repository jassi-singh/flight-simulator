import { aircraftState } from "../systems/physics";

// HUD elements
let hudContainer: HTMLDivElement;
let speedDisplay: HTMLDivElement;
let altitudeDisplay: HTMLDivElement;
let throttleDisplay: HTMLDivElement;
let stallWarningDisplay: HTMLDivElement;
let instructionsDisplay: HTMLDivElement;
let infoHintDisplay: HTMLDivElement;

// Constants for gameplay hints (match these with your physics system)
const MIN_TAKEOFF_SPEED = 50;
const MIN_TAKEOFF_THROTTLE = 30;
const MIN_CLIMB_SPEED = 60;

export function createHUD() {
  // Create main HUD container
  if (!hudContainer) {
    // Main HUD Container
    hudContainer = document.createElement("div");
    hudContainer.className = "hud-container";
    document.body.appendChild(hudContainer);

    // Create speed display
    speedDisplay = document.createElement("div");
    speedDisplay.className = "hud-item";
    hudContainer.appendChild(speedDisplay);

    // Create altitude display
    altitudeDisplay = document.createElement("div");
    altitudeDisplay.className = "hud-item";
    hudContainer.appendChild(altitudeDisplay);

    // Create throttle display
    throttleDisplay = document.createElement("div");
    throttleDisplay.className = "hud-item";
    hudContainer.appendChild(throttleDisplay);

    // Create stall warning display
    stallWarningDisplay = document.createElement("div");
    stallWarningDisplay.className = "stall-warning hud-item";
    hudContainer.appendChild(stallWarningDisplay);

    // Create info hint display
    infoHintDisplay = document.createElement("div");
    infoHintDisplay.className = "info-hint";
    infoHintDisplay.textContent = "Press 'I' for flight controls";
    hudContainer.appendChild(infoHintDisplay);

    // Create instructions display (initially hidden)
    instructionsDisplay = document.createElement("div");
    instructionsDisplay.className = "instructions-panel";
    instructionsDisplay.style.display = "none"; // Hidden by default
    document.body.appendChild(instructionsDisplay);

    // Add flight instructions content
    updateInstructions();

    // Add keyboard event listeners
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.code === "KeyI") {
    instructionsDisplay.style.display = "block";
  }
}

function handleKeyUp(event: KeyboardEvent) {
  if (event.code === "KeyI") {
    instructionsDisplay.style.display = "none";
  }
}

function updateInstructions() {
  if (instructionsDisplay) {
    instructionsDisplay.innerHTML = `
      <h2 class="instructions-title">Flight Controls</h2>
      <hr class="instructions-divider">
      <div class="controls-grid">
        <b>W / S:</b> <span>Increase / Decrease Throttle</span>
        <b>↓ Down Arrow:</b> <span>Nose Up (Climb)</span>
        <b>↑ Up Arrow:</b> <span>Nose Down (Descend)</span>
        <b>← → Arrows:</b> <span>Roll Left / Right</span>
        <b>Space:</b> <span>Fire Weapon</span>
      </div>
      
      <h3 class="section-title">Flight Requirements:</h3>
      <ul class="requirements-list">
        <li>Takeoff requires: ${MIN_TAKEOFF_THROTTLE}% throttle and ${MIN_TAKEOFF_SPEED} km/h speed</li>
        <li>Climbing requires: at least ${MIN_CLIMB_SPEED} km/h speed</li>
        <li>Use nose up (↓) only when you have sufficient speed</li>
      </ul>
      
      <p class="close-hint">
        Release 'I' to close
      </p>
    `;
  }
}

export function updateHUD() {
  if (!hudContainer) createHUD();

  // Update speed display
  speedDisplay.textContent = `Speed: ${Math.round(aircraftState.speed)} km/h`;

  // Update altitude display
  altitudeDisplay.textContent = `Altitude: ${Math.round(aircraftState.altitude)} m`;

  // Update throttle display
  throttleDisplay.textContent = `Throttle: ${Math.round(aircraftState.throttle * 100)}%`;

  // Update stall warning
  if (aircraftState.getStallWarning()) {
    stallWarningDisplay.textContent = "STALL WARNING";
    stallWarningDisplay.style.display = "block";

    // Flash the warning
    const time = Date.now() / 500;
    const flash = Math.sin(time) > 0;
    stallWarningDisplay.style.visibility = flash ? "visible" : "hidden";
  } else {
    stallWarningDisplay.textContent = "";
    stallWarningDisplay.style.display = "none";
  }
}

// Clean up function to remove event listeners when needed
export function cleanupHUD() {
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);
}
