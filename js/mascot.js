function hedgehog() {
  window.addEventListener("beforeunload", () => {
    sessionStorage.removeItem("meta-data");
  });

  // =============================================================================
  // Adjustable Constants
  // =============================================================================
  const HEDGEHOG_SIZE = 80
  // Set to 0 by default so you can easily tweak later.
  const JUMP_EXTRA_HEIGHT = 80
  const MIN_JUMP_DELAY = 2000
  const MAX_JUMP_DELAY = 6000
  const MAX_JUMPS = 3
  // Reduced tip delay range: tip will happen soon after the third jump.
  const TIP_DELAY_MIN = 2000
  const TIP_DELAY_MAX = 4000
  const SPEED = 80         // Walking speed (px/s)
  const GRAVITY = 2000     // Gravity (px/s²)
  const TIP_DISPLAY_DURATION = 7000
  const BOTTOM_OFFSET = 0 // Offset from the bottom of the viewport
  const MAX_TIPS_REQUESTS = 20

  // =============================================================================
  // Global State
  // =============================================================================
  // States: "walking", "jumping", or "fallingOff"
  let state = "walking"
  let isPaused = false
  let hedgehogElem = null
  let currentX = 0
  let currentY = 0
  let direction = 1  // 1 = right, -1 = left
  let lastTimestamp = null

  // Scheduler timer for jump events (no separate tip timer; tip is scheduled only after MAX_JUMPS jumps)
  let jumpSchedulerTimer = null

  // Jump-related variables
  let jumpFrom = null
  let jumpTo = null
  let jumpStartTime = null
  let jumpDuration = 0
  let v0x = 0
  let v0y = 0

  // Falling-off variables
  let fallStartTime = null
  let vFall = 0

  // Tip-related variables
  let nextTip = null
  let tipHistory = []
  // New variables to limit API calls to 10 tip events and cycle through stored tips.
  let tipsFetchedCount = 0;
  let tipIndex = 0;



  // Jump counter (after MAX_JUMPS jumps, next event will be a tip)
  let jumpCount = 0

  // When a jump lands on a candidate target, keep a reference.
  // When walking, if currentTarget is not null, the hedgehog remains at that target’s vertical level.
  let currentTarget = null

  // Return a random integer between min and max (inclusive).
  function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  // Returns true if an element is visible:
  // It must have nonzero dimensions and not be display:none or visibility:hidden.
  function isVisible(el) {
    const rect = el.getBoundingClientRect()
    const style = window.getComputedStyle(el)
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== "none" &&
      style.visibility !== "hidden"
    )
  }

  // Candidate targets: visible inputs, buttons, and links.
  // Also filter out elements that are too high (top less than 20% of viewport),
  // elements inside a navbar or mobile menu,
  // and those whose horizontal center is too close to the hedgehog’s current X.
  function getCandidateTargets() {
    return Array.from(document.querySelectorAll("input, button, a")).flatMap(el => {
      let rect = el.getBoundingClientRect();
      let targetEl = el; // The actual element to consider

      // If an input is hidden (size = 0), find its label instead
      if (el.tagName === "INPUT" && (rect.width === 0 || rect.height === 0)) {
        const label = document.querySelector(`label[for="${el.id}"]`);
        if (label) {
          const labelRect = label.getBoundingClientRect();
          if (labelRect.width > 0 && labelRect.height > 0) {
            rect = labelRect; // Use label's bounding box
            targetEl = label; // Target the label instead of the input
          }
        }
      }

      // Ensure the element is visible and has a size
      if (!isVisible(targetEl) || rect.width === 0 || rect.height === 0) return [];

      // Exclude elements too high on the page
      if (rect.top < window.innerHeight * 0.2) return [];

      // Exclude elements inside a navbar or mobile menu
      if (targetEl.closest(".navbar, .mobile-menu")) return [];

      return [targetEl]; // Return the correct interactive element
    });
  }



  // Calculate the "floor" Y coordinate.
  function getFloorY() {
    return window.scrollY + window.innerHeight - HEDGEHOG_SIZE - BOTTOM_OFFSET
  }

  // Clear the jump scheduler timer.
  function stopJumpScheduler() {
    if (jumpSchedulerTimer) {
      clearTimeout(jumpSchedulerTimer)
      jumpSchedulerTimer = null
    }
  }

  // =============================================================================
  // GPT Tip Fetching
  // =============================================================================

  async function askGPT() {
    const GOOGLE_SCRIPT_ID =
      "AKfycbzhjU72OnZLMUVP9cbt2pxMzrOkDBlf-mqn-rjfiowGrQkQLiB8aG2aCsSuH7ieRNuo";

    // Get reCAPTCHA token using v3 (invisible)
    let recaptchaToken = await new Promise((resolve, reject) => {
      grecaptcha.ready(() => {
        grecaptcha.execute("6LeRBs0qAAAAAIiW1Z7PUUx7pl6DtOpCvp9byo9C", { action: "askGPT" })
          .then(token => resolve(token))
          .catch(err => reject(err));
      });
    });

    // Function to recursively format metadata, handling nested objects
    function formatMetadata(obj, prefix = "") {
      return Object.entries(obj)
        .map(([key, value]) => {
          const fullKey = prefix ? `${prefix}.${key}` : key; // Format keys for nesting
          if (typeof value === "object" && value !== null) {
            return formatMetadata(value, fullKey); // Recurse into nested objects
          } else {
            return `- ${fullKey}: ${value}`; // Format simple key-value pairs
          }
        })
        .flat() // Flatten the nested arrays into a single-level array
        .join("\n");
    }

    // Retrieve and format meta-data object from sessionStorage safely
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

    // console.log("Sending prompt to GPT:", fullPrompt);

    try {
      const response = await fetch(
        `https://script.google.com/macros/s/${GOOGLE_SCRIPT_ID}/exec`,
        {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            prompt: fullPrompt,
            "g-recaptcha-response": recaptchaToken, // Include reCAPTCHA token
          }),
        }
      );

      const responseText = await response.text();
      const data = JSON.parse(responseText);
      // console.log("GPT Response:", data.response);
      return data.response;
    } catch (error) {
      console.error("Error fetching tip:", error);
      return "An error occurred.";
    }
  }


  // =============================================================================
  // Scheduling: Jump and Tip Events
  // =============================================================================

  // Schedule a jump event if state is "walking" and jumpCount is less than MAX_JUMPS.
  // If jumpCount is exactly MAX_JUMPS, schedule a tip event instead.
  function startJumpScheduler() {
    stopJumpScheduler()
    if (isPaused) return
    if (jumpCount < MAX_JUMPS) {
      jumpSchedulerTimer = setTimeout(() => {
        if (state === "walking" && !isPaused) {
          initiateJump()
        }
      }, randomBetween(MIN_JUMP_DELAY, MAX_JUMP_DELAY))
    } else {
      // When jumpCount is MAX_JUMPS, schedule a tip event after a short delay.
      jumpSchedulerTimer = setTimeout(() => {
        if (state === "walking" && !isPaused) {
          showCleaningTip()
        }
      }, randomBetween(TIP_DELAY_MIN, TIP_DELAY_MAX))
    }
  }

  // =============================================================================
  // Tip Event
  // =============================================================================

  function showCleaningTip() {
    if (state !== "walking") {
      startJumpScheduler();
      return;
    }
    // Pause the hedgehog immediately.
    isPaused = true;
    stopJumpScheduler();
    hedgehogElem.classList.remove("walking");
  
    let tipText;
    if (tipsFetchedCount < MAX_TIPS_REQUESTS) {
      tipText = nextTip || "Loading tip...";
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
    tooltip.style.left = (hedgehogRect.left + hedgehogRect.width / 2) + "px";
    tooltip.style.bottom = (window.innerHeight - hedgehogRect.top + 10) + "px";
    tooltip.style.transform = "translateX(-50%)";
    requestAnimationFrame(() => {
      tooltip.style.opacity = "1";
    });
  
    setTimeout(() => {
      tooltip.style.opacity = "0";
      tooltip.remove();
      // Resume motion after tip display.
      isPaused = false;
      hedgehogElem.classList.add("walking");
      state = "walking";
      // Reset jumpCount after a tip, then resume scheduling jumps.
      jumpCount = 0;
      startJumpScheduler();
    }, TIP_DISPLAY_DURATION);
  }
  

  // =============================================================================
  // Jump Logic
  // =============================================================================

  function initiateJump() {
    const candidates = getCandidateTargets()
    // console.log(candidates)
    if (candidates.length === 0) {
      currentTarget = null
      startJumpScheduler()
      return
    }
    const targetElem = candidates[randomBetween(0, candidates.length - 1)]
    currentTarget = targetElem

    const rect = targetElem.getBoundingClientRect()
    const pageWidth = document.documentElement.scrollWidth
    const floorY = getFloorY()

    // Calculate desired landing point:
    // Horizontally, center the hedgehog on the candidate.
    let landingX = rect.left + window.scrollX + rect.width / 2 - HEDGEHOG_SIZE / 2
    // Vertically, land so that the bottom of the hedgehog touches the top of the candidate.
    let landingY = rect.top + window.scrollY - HEDGEHOG_SIZE

    landingX = Math.max(0, Math.min(landingX, pageWidth - HEDGEHOG_SIZE))
    landingY = Math.max(0, Math.min(landingY, floorY))

    jumpFrom = { x: currentX, y: currentY }
    jumpTo = { x: landingX, y: landingY }

    // Calculate vertical velocity so that the apex is JUMP_EXTRA_HEIGHT above landing.
    v0y = -Math.sqrt(2 * GRAVITY * (Math.max(jumpFrom.y - jumpTo.y, 0) + JUMP_EXTRA_HEIGHT))

    const a = 0.5 * GRAVITY
    const b = v0y
    const c = jumpFrom.y - jumpTo.y
    const disc = b * b - 4 * a * c
    let T = 0
    if (disc < 0) {
      T = -b / (2 * a)
    } else {
      const t1 = (-b + Math.sqrt(disc)) / (2 * a)
      const t2 = (-b - Math.sqrt(disc)) / (2 * a)
      T = Math.max(t1, t2)
    }
    jumpDuration = T
    v0x = (jumpTo.x - jumpFrom.x) / jumpDuration
    stopJumpScheduler()
    state = "jumping"
    jumpStartTime = null
  }

  // =============================================================================
  // Main Animation Loop
  // =============================================================================

  function animate(timestamp) {
    // console.log("animate")
    // If paused, simply update lastTimestamp and skip state updates.
    if (isPaused) {
      lastTimestamp = timestamp
      window.requestAnimationFrame(animate)
      return
    }

    if (!lastTimestamp) {
      lastTimestamp = timestamp
    }
    const delta = (timestamp - lastTimestamp) / 1000
    lastTimestamp = timestamp

    const pageWidth = document.documentElement.scrollWidth
    const floorY = getFloorY()
    // console.log(state)
    if (state === "walking") {
      if (currentTarget) {
        // While walking on a candidate, fix vertical position.
        currentY = jumpTo.y
        currentX += direction * SPEED * delta

        // Get candidate's horizontal boundaries.
        const targetRect = currentTarget.getBoundingClientRect()
        const targetLeft = targetRect.left + window.scrollX
        const targetRight = targetRect.right + window.scrollX
        // If the entire hedgehog is off the candidate, transition to fallingOff.
        if (currentX + HEDGEHOG_SIZE - 20 <= targetLeft || currentX >= targetRight - 20) {
          state = "fallingOff"
          fallStartTime = null
          vFall = 0
        }
      } else {
        // Normal floor walking.
        currentY = floorY
        currentX += direction * SPEED * delta
        if (currentX < 0) {
          currentX = 0
          direction = 1
        } else if (currentX + HEDGEHOG_SIZE > pageWidth) {
          currentX = pageWidth - HEDGEHOG_SIZE
          direction = -1
        }
      }


    } else if (state === "jumping") {
      if (!jumpStartTime) {
        jumpStartTime = timestamp
      }
      let t = (timestamp - jumpStartTime) / 1000
      if (t > jumpDuration) {
        t = jumpDuration
      }

      currentX = jumpFrom.x + v0x * t
      currentY = jumpFrom.y + v0y * t + 0.5 * GRAVITY * t * t
      // console.log(currentX, currentY, v0x, v0y, t)
      if (v0x > 0) {
        direction = 1
      }
      else {
        direction = -1
      }
      // console.log(v0x)
      if (t >= jumpDuration) {
        currentX = jumpTo.x
        currentY = jumpTo.y
        state = "walking"
        direction = v0x < 0 ? -1 : 1
        jumpCount++
        startJumpScheduler()
      }
    } else if (state === "fallingOff") {
      if (!fallStartTime) {
        fallStartTime = timestamp
        vFall = 0
      }
      currentX += direction * SPEED * delta
      vFall += GRAVITY * delta
      currentY += vFall * delta
      if (currentY >= floorY) {
        currentY = floorY
        state = "walking"
        currentTarget = null
        // Add a brief delay after landing.
        setTimeout(() => {
          if (!isPaused) startJumpScheduler()
        }, 500)
      }
    }

    hedgehogElem.style.left = currentX + "px"
    hedgehogElem.style.top = currentY + "px"
    hedgehogElem.style.transform = direction === -1 ? "scaleX(-1)" : "scaleX(1)"
    window.requestAnimationFrame(animate)
  }

  // =============================================================================
  // Pause / Resume
  // =============================================================================

  function togglePause() {
    isPaused = !isPaused
    if (isPaused) {
      stopJumpScheduler()
      hedgehogElem.classList.remove("walking")
      console.log("Hedgehog paused.")
    } else {
      // Resume by resetting timing variables and starting the scheduler.
      lastTimestamp = performance.now()
      hedgehogElem.classList.add("walking")
      console.log("Hedgehog resumed.")
      startJumpScheduler()
    }
  }

  // =============================================================================
  // Inject CSS
  // =============================================================================

  function injectCSS() {
    const style = document.createElement("style")
    style.innerHTML = `
      #hedgehog {
        position: absolute;
        width: ${HEDGEHOG_SIZE}px;
        height: ${HEDGEHOG_SIZE}px;
        background-image: url('/assets/walk.png');
        // background-image: url('https://us.posthog.com/static/hedgehog/sprites/skins/default/walk.png');
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
        background: #444;
        color: #fff;
        border-radius: 8px;
        font-size: 14px;
        z-index: 2100;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s ease;
        max-width: 400px;
        text-align: center;
      }
      .cleaning-tooltip:after {
        content: "";
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border-width: 12px;
        border-style: solid;
        border-color: #444 transparent transparent transparent;
      }
    `
    document.head.appendChild(style)
  }

  // =============================================================================
  // Initialization
  // =============================================================================

  function init() {
    injectCSS()
    hedgehogElem = document.createElement("div")
    hedgehogElem.id = "hedgehog"
    hedgehogElem.classList.add("walking")
    hedgehogElem.addEventListener("click", togglePause)
    document.body.appendChild(hedgehogElem)

    currentX = 0
    currentY = getFloorY()
    hedgehogElem.style.left = currentX + "px"
    hedgehogElem.style.top = currentY + "px"
    state = "walking"

    askGPT().then(response => {
      nextTip = response
    })

    startJumpScheduler()
    window.requestAnimationFrame(animate)
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init)
  } else {
    init()
  }
}

if (window.innerWidth > 768) {
  hedgehog()
}
