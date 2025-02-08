function hedgehog() {
  window.addEventListener("beforeunload", () => {
    sessionStorage.removeItem("meta-data");
  });

  const HEDGEHOG_SIZE = 80;
  const JUMP_EXTRA_HEIGHT = 80;
  const MIN_JUMP_DELAY = 2000;
  const MAX_JUMP_DELAY = 6000;
  const MAX_JUMPS = 3;
  const TIP_DELAY_MIN = 2000;
  const TIP_DELAY_MAX = 4000;
  const SPEED = 80;
  const GRAVITY = 2000;
  const TIP_DISPLAY_DURATION = 7000;
  const BOTTOM_OFFSET = 0;
  const MAX_TIPS_REQUESTS = 20;
  const FPS = 120;

  // States: "walking", "jumping", or "fallingOff"
  let state = "walking";
  let isPaused = false;
  let hedgehogElem = null;
  let currentX = 0;
  let currentY = 0;
  let direction = 1; // 1 = right, -1 = left
  let lastTimestamp = null;

  let jumpSchedulerTimer = null;

  let jumpFrom = null;
  let jumpTo = null;
  let jumpStartTime = null;
  let jumpDuration = 0;
  let v0x = 0;
  let v0y = 0;

  let fallStartTime = null;
  let vFall = 0;

  let nextTip = null;
  let tipHistory = [];
  let tipsFetchedCount = 0;
  let tipIndex = 0;

  // Jump counter (after MAX_JUMPS jumps, next event will be a tip)
  let jumpCount = 0;

  // When a jump lands on a candidate target, keep a reference.
  // When walking, if currentTarget is not null, the hedgehog remains at that target’s vertical level.
  let currentTarget = null;

  // User control variables:
  let userControlActive = false;
  let userControlTimer = null;
  let manualDirection = 0; // -1 (left), 0 (none), 1 (right)

  /**
 * Creates a frame rate limiter that allows updates only at the specified FPS.
 * @param {number} fps - Desired frames per second.
 * @returns {function} - A function that accepts the current timestamp and returns true if enough time has passed.
 */
  function createFrameRateLimiter(fps) {
    const minInterval = 1000 / fps;
    let lastTimestamp = null;
    return function (timestamp) {
      if (lastTimestamp === null || timestamp - lastTimestamp >= minInterval) {
        lastTimestamp = timestamp;
        return true;
      }
      return false;
    };
  }

  const frameRateLimiter = createFrameRateLimiter(FPS);

  // When a user key is pressed, mark that we're under manual control for 3 seconds.
  function activateUserControl() {
    userControlActive = true;
    if (userControlTimer) clearTimeout(userControlTimer);
    userControlTimer = setTimeout(() => {
      userControlActive = false;
    }, 3000);
  }

  // Return a random integer between min and max (inclusive).
  function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Returns true if an element is visible.
  function isVisible(el) {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== "none" &&
      style.visibility !== "hidden"
    );
  }

  function getCandidateTargets() {
    return Array.from(document.querySelectorAll("input, button, a")).flatMap(el => {
      let rect = el.getBoundingClientRect();
      let targetEl = el;

      if (el.tagName === "INPUT" && (rect.width === 0 || rect.height === 0)) {
        const label = document.querySelector(`label[for="${el.id}"]`);
        if (label) {
          const labelRect = label.getBoundingClientRect();
          if (labelRect.width > 0 && labelRect.height > 0) {
            rect = labelRect;
            targetEl = label;
          }
        }
      }

      if (!isVisible(targetEl) || rect.width === 0 || rect.height === 0) return [];
      if (rect.top < window.innerHeight * 0.2) return [];
      if (targetEl.closest(".navbar, .mobile-menu")) return [];

      return [targetEl];
    });
  }

  function getFloorY() {
    return window.innerHeight - HEDGEHOG_SIZE - BOTTOM_OFFSET;
  }

  function stopJumpScheduler() {
    if (jumpSchedulerTimer) {
      clearTimeout(jumpSchedulerTimer);
      jumpSchedulerTimer = null;
    }
  }

  async function askGPT() {
    const GOOGLE_SCRIPT_ID =
      "AKfycbzhjU72OnZLMUVP9cbt2pxMzrOkDBlf-mqn-rjfiowGrQkQLiB8aG2aCsSuH7ieRNuo";
    let recaptchaToken = await new Promise((resolve, reject) => {
      grecaptcha.ready(() => {
        grecaptcha.execute("6LeRBs0qAAAAAIiW1Z7PUUx7pl6DtOpCvp9byo9C", { action: "askGPT" })
          .then(token => resolve(token))
          .catch(err => reject(err));
      });
    });

    function formatMetadata(obj, prefix = "") {
      return Object.entries(obj)
        .map(([key, value]) => {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          if (typeof value === "object" && value !== null) {
            return formatMetadata(value, fullKey);
          } else {
            return `- ${fullKey}: ${value}`;
          }
        })
        .flat()
        .join("\n");
    }

    let metaDataStr = "No user data available yet";
    try {
      const storedData = sessionStorage.getItem("meta-data");
      if (storedData) {
        const metaData = JSON.parse(storedData);
        metaDataStr = formatMetadata(metaData);
      }
    } catch (error) {
      console.error("Failed to parse sessionStorage meta-data:", error);
    }

    const tipHistoryStr =
      tipHistory.length > 0
        ? tipHistory.slice(-10).map((tip, index) => `${index + 1}. ${tip}`).join("\n")
        : "No previous tips.";

    const fullPrompt = `
  ### USER-DATA ###
  ${metaDataStr}
  
  ### PREVIOUS TIPS ###
  ${tipHistoryStr}
    `.trim();

    try {
      const response = await fetch(
        `https://script.google.com/macros/s/${GOOGLE_SCRIPT_ID}/exec`,
        {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            prompt: fullPrompt,
            "g-recaptcha-response": recaptchaToken,
          }),
        }
      );

      const responseText = await response.text();
      const data = JSON.parse(responseText);
      return data.response;
    } catch (error) {
      console.error("Error fetching tip:", error);
      return "An error occurred.";
    }
  }

  function startJumpScheduler() {
    stopJumpScheduler();
    // Do not schedule automatic jumps when user is controlling.
    if (userControlActive) return;
    if (jumpCount < MAX_JUMPS) {
      jumpSchedulerTimer = setTimeout(() => {
        if (state === "walking" && !isPaused && !userControlActive) {
          initiateJump();
        }
      }, randomBetween(MIN_JUMP_DELAY, MAX_JUMP_DELAY));
    } else {
      jumpSchedulerTimer = setTimeout(() => {
        if (state === "walking" && !isPaused && !userControlActive) {
          showCleaningTip();
        }
      }, randomBetween(TIP_DELAY_MIN, TIP_DELAY_MAX));
    }
  }

  function showCleaningTip() {
    if (state !== "walking") {
      startJumpScheduler();
      return;
    }
    isPaused = true;
    stopJumpScheduler();
    hedgehogElem.classList.remove("walking");

    let tipText;
    if (tipsFetchedCount < MAX_TIPS_REQUESTS) {
      tipText = nextTip || "For a quick and streak-free shine on mirrors and glass, use a microfiber cloth with a mix of vinegar and water (1:1 ratio). Buff dry with a clean, dry cloth for a crystal-clear finish! 🚿✨";
      tipsFetchedCount++;
      tipHistory.push(tipText);
      askGPT().then(response => {
        nextTip = response;
      });
    } else {
      tipText = tipHistory[tipIndex];
      tipIndex = (tipIndex + 1) % tipHistory.length;
    }

    const tooltip = document.createElement("div");
    tooltip.className = "cleaning-tooltip";
    tooltip.innerText = tipText;
    document.body.appendChild(tooltip);
    const hedgehogRect = hedgehogElem.getBoundingClientRect();
    const desiredLeft = hedgehogRect.left + hedgehogRect.width / 2 - 150; // Center tooltip over hedgehog
    // Then set the tooltip’s left with a clamped value:
    tooltip.style.left = `clamp(10px, ${desiredLeft}px, calc(100vw - 310px))`;
    tooltip.style.bottom = (window.innerHeight - hedgehogRect.top + 10) + "px";
    // tooltip.style.transform = "translateX(-50%)";

    const tooltipRect = tooltip.getBoundingClientRect();
    // Compute hedgehog center relative to the viewport:
    const hedgehogCenter = hedgehogRect.left + hedgehogRect.width / 2;

    const arrowOffset = hedgehogCenter - tooltipRect.left;
    // Set a CSS variable on the tooltip for the arrow position.
    tooltip.style.setProperty("--arrow-offset", arrowOffset + "px");

    requestAnimationFrame(() => {
      tooltip.style.opacity = "1";
    });

    setTimeout(() => {
      tooltip.style.opacity = "0";
      tooltip.remove();
      isPaused = false;
      hedgehogElem.classList.add("walking");
      state = "walking";
      jumpCount = 0;
      startJumpScheduler();
    }, TIP_DISPLAY_DURATION);
  }

  function initiateJump() {
    const candidates = getCandidateTargets();
    if (candidates.length === 0) {
      currentTarget = null;
      startJumpScheduler();
      return;
    }
    const targetElem = candidates[randomBetween(0, candidates.length - 1)];
    currentTarget = targetElem;

    const rect = targetElem.getBoundingClientRect();
    const pageWidth = document.documentElement.scrollWidth;
    const floorY = getFloorY();

    // Calculate desired landing point.
    let landingX = rect.left + rect.width / 2 - HEDGEHOG_SIZE / 2;
    let landingY = rect.top - HEDGEHOG_SIZE;

    landingX = Math.max(0, Math.min(landingX, pageWidth - HEDGEHOG_SIZE));
    landingY = Math.max(0, Math.min(landingY, floorY));

    jumpFrom = { x: currentX, y: currentY };
    jumpTo = { x: landingX, y: landingY };

    v0y = -Math.sqrt(2 * GRAVITY * (Math.max(jumpFrom.y - jumpTo.y, 0) + JUMP_EXTRA_HEIGHT));

    const a = 0.5 * GRAVITY;
    const b = v0y;
    const c = jumpFrom.y - jumpTo.y;
    const disc = b * b - 4 * a * c;
    let T = 0;
    if (disc < 0) {
      T = -b / (2 * a);
    } else {
      const t1 = (-b + Math.sqrt(disc)) / (2 * a);
      const t2 = (-b - Math.sqrt(disc)) / (2 * a);
      T = Math.max(t1, t2);
    }
    jumpDuration = T;
    v0x = (jumpTo.x - jumpFrom.x) / jumpDuration;
    stopJumpScheduler();
    state = "jumping";
    jumpStartTime = null;
  }

  function animate(timestamp) {
    // Throttle updates to the desired frame rate.
    if (!frameRateLimiter(timestamp)) {
      window.requestAnimationFrame(animate);
      return;
    }
    if (isPaused) {
      lastTimestamp = timestamp;
      window.requestAnimationFrame(animate);
      return;
    }

    if (!lastTimestamp) {
      lastTimestamp = timestamp;
    }
    const delta = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    const pageWidth = window.innerWidth;
    const floorY = getFloorY();

    if (state === "walking") {
      // If the user is controlling, only update position when keys are pressed.
      if (userControlActive) {
        if (manualDirection !== 0) {
          currentX += manualDirection * SPEED * delta;
          direction = manualDirection;
        }
        currentY = floorY;
      } else {
        if (currentTarget) {
          currentY = jumpTo.y;
          currentX += direction * SPEED * delta;
          const targetRect = currentTarget.getBoundingClientRect();
          const targetLeft = targetRect.left + window.scrollX;
          const targetRight = targetRect.right + window.scrollX;
          if (currentX + HEDGEHOG_SIZE - 20 <= targetLeft || currentX >= targetRight - 20) {
            state = "fallingOff";
            fallStartTime = null;
            vFall = 0;
          }
        } else {
          currentY = floorY;
          currentX += direction * SPEED * delta;
          if (currentX < 0) {
            currentX = 0;
            direction = 1;
          } else if (currentX + HEDGEHOG_SIZE > pageWidth) {
            currentX = pageWidth - HEDGEHOG_SIZE;
            direction = -1;
          }
        }
      }
    } else if (state === "jumping") {
      if (!jumpStartTime) {
        jumpStartTime = timestamp;
      }
      let t = (timestamp - jumpStartTime) / 1000;
      if (t > jumpDuration) {
        t = jumpDuration;
      }
      currentX = jumpFrom.x + v0x * t;
      currentY = jumpFrom.y + v0y * t + 0.5 * GRAVITY * t * t;
      direction = v0x > 0 ? 1 : -1;
      if (t >= jumpDuration) {
        currentX = jumpTo.x;
        currentY = jumpTo.y;
        state = "walking";
        direction = v0x < 0 ? -1 : 1;
        jumpCount++;
        startJumpScheduler();
      }
    } else if (state === "fallingOff") {
      if (!fallStartTime) {
        fallStartTime = timestamp;
        vFall = 0;
      }
      currentX += direction * SPEED * delta;
      vFall += GRAVITY * delta;
      currentY += vFall * delta;
      if (currentY >= floorY) {
        currentY = floorY;
        state = "walking";
        currentTarget = null;
        setTimeout(() => {
          if (!isPaused) startJumpScheduler();
        }, 500);
      }
    }

    hedgehogElem.style.left = currentX + "px";
    hedgehogElem.style.top = currentY + "px";
    hedgehogElem.style.transform = direction === -1 ? "scaleX(-1)" : "scaleX(1)";
    window.requestAnimationFrame(animate);
  }

  // Keyboard controls: arrow keys for direction, space to jump, and "t" to show a tip.
  function setupControls() {
    window.addEventListener("keydown", (e) => {
      activateUserControl();
      if (e.key === "ArrowLeft") {
        manualDirection = -1;
      } else if (e.key === "ArrowRight") {
        manualDirection = 1;
      } else if (e.key === " ") {
        if (state === "walking") {
          initiateJump();
        }
      } else if (e.key.toLowerCase() === "t") {
        if (state === "walking") {
          showCleaningTip();
        }
      }
    });

    window.addEventListener("keyup", (e) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        manualDirection = 0;
      }
    });
  }

  function injectCSS() {
    const style = document.createElement("style");
    style.innerHTML = `
      #hedgehog {
        position: fixed;
        width: ${HEDGEHOG_SIZE}px;
        height: ${HEDGEHOG_SIZE}px;
        background-image: url('/assets/walk.png');
        background-size: 800% auto;
        z-index: 2000;
      }
      .walking {
        animation: walk 0.8s steps(8) infinite;
      }
      @keyframes walk {
        from { background-position: 0 0; }
        to { background-position: -640px 0; }
      }
      .cleaning-tooltip {
        position: absolute;
        padding: 8px 12px;
        background: var(--color-secondary);
        color: #fff;
        border-radius: 8px;
        font-size: 14px;
        z-index: 2100;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s ease;
        width: 300px;
        text-align: center;
        white-space: normal;
        left: clamp(10px, calc(50% - 150px), calc(100vw - 310px));
      }

      .cleaning-tooltip:after {
        content: "";
        position: absolute;
        top: 100%;
        /* Use the computed --arrow-offset, default to 50% if not set */
        left: var(--arrow-offset, 50%);
        transform: translateX(-50%);
        border-width: 12px;
        border-style: solid;
        border-color: var(--color-secondary) transparent transparent transparent;
      }


    `;
    document.head.appendChild(style);
  }

  function init() {
    injectCSS();
    hedgehogElem = document.createElement("div");
    hedgehogElem.id = "hedgehog";
    hedgehogElem.classList.add("walking");
    hedgehogElem.addEventListener("click", () => {
      isPaused = !isPaused;
      if (isPaused) {
        stopJumpScheduler();
        hedgehogElem.classList.remove("walking");
      } else {
        lastTimestamp = performance.now();
        hedgehogElem.classList.add("walking");
        startJumpScheduler();
      }
    });
    document.body.appendChild(hedgehogElem);

    currentX = 0;
    currentY = getFloorY();
    hedgehogElem.style.left = currentX + "px";
    hedgehogElem.style.top = currentY + "px";
    state = "walking";

    askGPT().then(response => {
      nextTip = response;
    });

    if (localStorage.getItem('mascot') === "true") {
      setupControls();
    }

    startJumpScheduler();
    window.requestAnimationFrame(animate);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}

if (window.innerWidth > 768) {
  // Ensure flags are loaded before usage.
  // You'll only need to call this on the code for when the first time a user visits.
  posthog.onFeatureFlags(function () {
    // feature flags should be available at this point
    if (posthog.isFeatureEnabled('MascotWalkingShowingTips')) {
      hedgehog();
    }
  })
}
