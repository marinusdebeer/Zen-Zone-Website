function hedgehog() {
  // =============================================================================
  // Adjustable Constants
  // =============================================================================
  const JUMP_EXTRA_HEIGHT = 100;       // Apex is 100px above the target’s top.
  const MIN_JUMP_DELAY = 3000;         // Minimum delay (ms) before next jump attempt.
  const MAX_JUMP_DELAY = 6000;         // Maximum delay (ms) before next jump attempt.
  const EDGE_THRESHOLD = -80;          // Must move 80px past target edge to trigger fall.
  const NORMAL_SPEED = 80;             // Roaming speed (px/s) along the bottom.
  const ON_TARGET_SPEED = 80;          // Roaming speed (px/s) when on a target.

  // Gravity in px/s².
  const GRAVITY = 1000;

  // =============================================================================
  // Global State & Variables
  // =============================================================================
  let state = "roaming";               // States: roaming, jumping, onTarget, fallingOff.
  let isPaused = false;                // Toggled by user click.
  let hedgehogElem = null;
  let direction = 1;                   // 1 = right, -1 = left.
  let currentX = 0;
  let currentY = 0;
  let lastTimestamp = null;

  // --- Jump Physics Variables ---
  let jumpStartTime = null;            // Timestamp when the jump starts.
  let jumpFrom = null;                 // Starting coordinates { x, y }.
  let jumpTo = null;                   // Landing coordinates { x, y } (target’s top).
  let jumpTime = 0;                    // Total flight time (seconds).
  let v0x = 0;                         // Initial horizontal velocity (px/s).
  let v0y = 0;                         // Initial vertical velocity (px/s; negative means upward).

  // --- Target & On-Target Roaming Data ---
  let targetElem = null;               // The chosen target element.
  let onTargetData = null;             // Horizontal boundaries and roaming direction when on target.

  // --- Falling Off Variables ---
  let fallStartTime = null;
  let vFall = 0;                       // Vertical velocity during free-fall.

  // --- Scheduler Timer ---
  let jumpSchedulerTimer = null;

  // =============================================================================
  // Inject CSS
  // =============================================================================
  function injectCSS() {
    const style = document.createElement("style");
    style.innerHTML = `
      #hedgehog {
        position: absolute;
        width: 80px;
        height: 80px;
        z-index: 2000;
        background-image: url('https://us.posthog.com/static/hedgehog/sprites/skins/default/walk.png');
        background-size: 800% auto;
        background-position: 0 0;
        transition: left 0.3s linear, top 0.35s ease, transform 0.1s ease;
      }
      .walking {
        animation: walk 0.8s steps(8) infinite;
      }
      @keyframes walk {
        from { background-position: 0 0; }
        to { background-position: -640px 0; }
      }
    `;
    document.head.appendChild(style);
  }

  // =============================================================================
  // Utility Functions & Candidate Filtering
  // =============================================================================
  function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function isVisible(el) {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.visibility !== "hidden" &&
      style.display !== "none"
    );
  }

  // Returns candidate targets (inputs, buttons, a tags).
  // For hidden radio inputs, returns their associated label if visible.
  // Also ensures that the element is fully within the viewport horizontally
  // and is in the lower 80% of the viewport.
  function getCandidateTargets() {
    const elems = Array.from(document.querySelectorAll("input, button, a"));
    const candidates = elems.map(el => {
      if (el.tagName.toLowerCase() === "input" && el.type === "radio" && !isVisible(el)) {
        const label = document.querySelector(`label[for="${el.id}"]`);
        return label && isVisible(label) ? label : null;
      }
      return isVisible(el) ? el : null;
    }).filter(el => el !== null);
    return candidates.filter(el => {
      const rect = el.getBoundingClientRect();
      return (
        rect.top >= window.innerHeight * 0.2 &&
        rect.left >= 0 &&
        rect.right <= window.innerWidth
      );
    });
  }

  // =============================================================================
  // Jump Scheduler – Guaranteeing a Jump When Scheduled
  // =============================================================================
  function startJumpScheduler() {
    stopJumpScheduler();
    const delay = randomBetween(MIN_JUMP_DELAY, MAX_JUMP_DELAY);
    jumpSchedulerTimer = setTimeout(() => {
      if (state === "roaming" && !isPaused) {
        initiateJump();
      }
    }, delay);
  }

  function stopJumpScheduler() {
    if (jumpSchedulerTimer) {
      clearTimeout(jumpSchedulerTimer);
      jumpSchedulerTimer = null;
    }
  }

  // =============================================================================
  // Jump Logic
  // =============================================================================
  function initiateJump() {
    const candidates = getCandidateTargets();
    if (candidates.length === 0) {
      startJumpScheduler();
      return;
    }
    targetElem = candidates[randomBetween(0, candidates.length - 1)];
    const rect = targetElem.getBoundingClientRect();
    const targetRect = {
      left: rect.left + window.scrollX,
      top: rect.top + window.scrollY,
      width: rect.width,
      height: rect.height
    };
    const hedgehogWidth = 80;
    const hedgehogHeight = 80;
    const landingX = targetRect.left + targetRect.width / 2 - hedgehogWidth / 2;
    const landingY = targetRect.top - hedgehogHeight;
    jumpFrom = { x: currentX, y: currentY };
    jumpTo = { x: landingX, y: landingY };

    const v0yAbs = Math.sqrt(2 * GRAVITY * (jumpFrom.y - jumpTo.y + JUMP_EXTRA_HEIGHT));
    v0y = -v0yAbs;
    const a = 0.5 * GRAVITY;
    const b = v0y;
    const c = jumpFrom.y - jumpTo.y;
    const disc = b * b - 4 * a * c;
    let T = 0;
    if (disc < 0) {
      T = -b / a;
    } else {
      const t1 = (-b + Math.sqrt(disc)) / (2 * a);
      const t2 = (-b - Math.sqrt(disc)) / (2 * a);
      T = Math.max(t1, t2);
    }
    jumpTime = T;
    v0x = (jumpTo.x - jumpFrom.x) / T;
    state = "jumping";
    jumpStartTime = null;
    stopJumpScheduler();
  }

  function enterOnTarget() {
    state = "onTarget";
    const rect = targetElem.getBoundingClientRect();
    const targetLeft = rect.left + window.scrollX;
    const targetRight = targetLeft + rect.width;
    const hedgehogWidth = 80;
    onTargetData = {
      leftLimit: targetLeft,
      rightLimit: targetRight - hedgehogWidth,
      direction: direction
    };
  }

  function initiateFallOff() {
    state = "fallingOff";
    fallStartTime = null;
    vFall = 0;
  }

  function resumeRoaming() {
    state = "roaming";
    targetElem = null;
    onTargetData = null;
    hedgehogElem.classList.add("walking");
    startJumpScheduler();
  }

  // =============================================================================
  // Click-to-Pause / Resume Logic
  // =============================================================================
  function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
      hedgehogElem.classList.remove("walking");
      stopJumpScheduler();
    } else {
      if (state === "roaming" || state === "onTarget") {
        hedgehogElem.classList.add("walking");
      }
      if (state === "roaming") {
        startJumpScheduler();
      }
    }
  }

  // =============================================================================
  // Animation Loop
  // =============================================================================
  function animate(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const delta = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    if (isPaused) {
      window.requestAnimationFrame(animate);
      return;
    }

    const hedgehogWidth = 80;
    const hedgehogHeight = 80;
    const pageWidth = document.documentElement.scrollWidth;
    const viewportBottom = window.scrollY + window.innerHeight - hedgehogHeight - 10;

    switch (state) {
      case "roaming":
        currentY = viewportBottom;
        currentX += direction * NORMAL_SPEED * delta;
        if (currentX < 0) {
          currentX = 0;
          direction = 1;
        } else if (currentX + hedgehogWidth > pageWidth) {
          currentX = pageWidth - hedgehogWidth;
          direction = -1;
        }
        hedgehogElem.style.transform = direction === -1 ? "scaleX(-1)" : "scaleX(1)";
        break;

      case "jumping":
        if (!jumpStartTime) jumpStartTime = timestamp;
        let t_elapsed = (timestamp - jumpStartTime) / 1000;
        if (t_elapsed > jumpTime) t_elapsed = jumpTime;
        currentX = jumpFrom.x + v0x * t_elapsed;
        currentY = jumpFrom.y + v0y * t_elapsed + 0.5 * GRAVITY * t_elapsed * t_elapsed;
        hedgehogElem.style.transform = v0x < 0 ? "scaleX(-1)" : "scaleX(1)";
        if (t_elapsed >= jumpTime) {
          currentX = jumpTo.x;
          currentY = jumpTo.y;
          direction = (v0x < 0) ? -1 : 1;
          enterOnTarget();
        }
        break;

      case "onTarget":
        if (onTargetData) {
          currentX += onTargetData.direction * ON_TARGET_SPEED * delta;
          if (onTargetData.direction === -1 && currentX <= onTargetData.leftLimit + EDGE_THRESHOLD) {
            currentX = onTargetData.leftLimit + EDGE_THRESHOLD;
            initiateFallOff();
          } else if (onTargetData.direction === 1 && currentX >= onTargetData.rightLimit - EDGE_THRESHOLD) {
            currentX = onTargetData.rightLimit - EDGE_THRESHOLD;
            initiateFallOff();
          }
          hedgehogElem.style.transform = onTargetData.direction === -1 ? "scaleX(-1)" : "scaleX(1)";
        }
        break;

      case "fallingOff":
        if (!fallStartTime) {
          fallStartTime = timestamp;
          vFall = 0;
        }
        vFall += GRAVITY * delta;
        currentY += vFall * delta;
        if (currentY >= viewportBottom) {
          currentY = viewportBottom;
          resumeRoaming();
        }
        break;

      default:
        break;
    }

    hedgehogElem.style.left = currentX + "px";
    hedgehogElem.style.top = currentY + "px";
    window.requestAnimationFrame(animate);
  }

  // =============================================================================
  // Initialization
  // =============================================================================
  function init() {
    injectCSS();
    hedgehogElem = document.createElement("div");
    hedgehogElem.id = "hedgehog";
    hedgehogElem.classList.add("walking");
    currentX = 0;
    currentY = window.scrollY + window.innerHeight - 80 - 10;
    hedgehogElem.style.left = currentX + "px";
    hedgehogElem.style.top = currentY + "px";

    hedgehogElem.addEventListener("click", togglePause);
    document.body.appendChild(hedgehogElem);

    state = "roaming";
    direction = 1;
    startJumpScheduler();
    window.requestAnimationFrame(animate);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}


hedgehog();