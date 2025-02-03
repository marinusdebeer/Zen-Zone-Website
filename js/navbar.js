// navbar.js

document.addEventListener("DOMContentLoaded", () => {


  loadNavbar()
    .then(initializeNavbar)
    .then(initializeSmoothScrolling)
    .then(initializeActiveSectionHighlighting)
    .then(darkMode)
    .then(hedgehog);

});

/**
 * Dynamically Load Navbar
 */
function loadNavbar() {
  return fetch("/navbar.html")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load navbar.html");
      }
      return response.text();
    })
    .then((html) => {
      document.getElementById("navbar").innerHTML = html;
    })
    .catch((err) => console.error("Error loading navbar:", err));
}






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
      /* Walking animation: cycles through 8 frames every 0.8s */
      .walking {
        animation: walk 0.8s steps(8) infinite;
      }
      @keyframes walk {
        from { background-position: 0 0; }
        to   { background-position: -640px 0; }
      }
      .hedgehog-target {
        outline: 2px solid yellow;
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

  // Returns an array of candidate targets. For inputs of type radio (which are hidden),
  // we try to return their associated label (using the "for" attribute).
  function getCandidateTargets() {
    const elems = Array.from(document.querySelectorAll("input, button"));
    const candidates = elems.map(el => {
      // If the element is an input of type radio and is not visible,
      // try to get its associated label.
      if (el.tagName.toLowerCase() === "input" && el.type === "radio" && !isVisible(el)) {
        const label = document.querySelector(`label[for="${el.id}"]`);
        if (label && isVisible(label)) {
          return label;
        }
        return null;
      }
      return isVisible(el) ? el : null;
    }).filter(el => el !== null);

    // Now filter out candidates that are not in the lower 80% of the viewport.
    return candidates.filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.top >= window.innerHeight * 0.2;
    });
  }

  // =============================================================================
  // Jump Scheduler – Guaranteed Jump When Scheduled
  // =============================================================================
  function startJumpScheduler() {
    stopJumpScheduler();
    const delay = randomBetween(MIN_JUMP_DELAY, MAX_JUMP_DELAY);
    console.log("Scheduling jump in", delay, "ms");
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
    console.log("Candidate jump targets:", candidates);
    if (candidates.length === 0) {
      console.log("No suitable targets. Rescheduling jump...");
      startJumpScheduler();
      return;
    }
    targetElem = candidates[randomBetween(0, candidates.length - 1)];
    console.log("Chosen target:", targetElem);

    const rect = targetElem.getBoundingClientRect();
    const targetRect = {
      left: rect.left + window.scrollX,
      top: rect.top + window.scrollY,
      width: rect.width,
      height: rect.height
    };

    const hedgehogWidth = 80;
    const hedgehogHeight = 80;
    // The landing position aligns the hedgehog’s bottom with the target’s top.
    const landingX = targetRect.left + targetRect.width / 2 - hedgehogWidth / 2;
    const landingY = targetRect.top - hedgehogHeight;

    jumpFrom = { x: currentX, y: currentY };
    jumpTo = { x: landingX, y: landingY };

    // Compute initial vertical velocity (v0y) so that the apex is JUMP_EXTRA_HEIGHT above target.
    const v0yAbs = Math.sqrt(2 * GRAVITY * (jumpFrom.y - jumpTo.y + JUMP_EXTRA_HEIGHT));
    v0y = -v0yAbs; // Negative => upward.
    // Solve for total flight time T from: jumpTo.y = jumpFrom.y + v0y*T + 0.5*GRAVITY*T².
    const a = 0.5 * GRAVITY;
    const b = v0y;
    const c = jumpFrom.y - jumpTo.y;
    const disc = b * b - 4 * a * c;
    let T = 0;
    if (disc < 0) {
      T = -b / a; // Fallback.
    } else {
      const t1 = (-b + Math.sqrt(disc)) / (2 * a);
      const t2 = (-b - Math.sqrt(disc)) / (2 * a);
      T = Math.max(t1, t2);
    }
    jumpTime = T;
    v0x = (jumpTo.x - jumpFrom.x) / T;

    console.log("Jump data:", { jumpFrom, jumpTo, v0x, v0y, jumpTime });

    targetElem.classList.add("hedgehog-target");
    stopJumpScheduler();
    state = "jumping";
    jumpStartTime = null;
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
    if (targetElem) {
      targetElem.classList.remove("hedgehog-target");
    }
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
  // Click-to-Pause / Resume
  // =============================================================================
  function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
      hedgehogElem.classList.remove("walking");
      console.log("Hedgehog paused by user click");
      stopJumpScheduler();
    } else {
      if (state === "roaming" || state === "onTarget") {
        hedgehogElem.classList.add("walking");
      }
      console.log("Hedgehog unpaused by user click");
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

    console.log("Candidate targets at startup:", getCandidateTargets());

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







































/**
 * Dark/Light Mode Toggle Function
 */
function darkMode() {

  const sunIcon = document.querySelector(".icon.sun");
  const moonIcon = document.querySelector(".icon.moon");

  // Retrieve the saved theme from localStorage or default to 'light'
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);

  // Function to apply the theme
  const applyTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);

    // Show/hide icons based on theme
    sunIcon.style.display = theme === "dark" ? "block" : "none";
    moonIcon.style.display = theme === "dark" ? "none" : "block";
  };

  // Apply the saved theme on page load
  applyTheme(savedTheme);

  // Add event listeners to toggle on icon click
  sunIcon.addEventListener("click", () => applyTheme("light"));
  moonIcon.addEventListener("click", () => applyTheme("dark"));
}

/**
 * Initialize Navbar Functionality
 */
function initializeNavbar() {
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileMenu = document.querySelector(".mobile-menu");
  const mobileMenuOverlay = document.getElementById("mobileMenuOverlay");

  if (!menuToggle || !mobileMenu || !mobileMenuOverlay) {
    console.warn("Navbar elements not found. Ensure navbar.html is loaded correctly.");
    return;
  }

  // Event Listener: Toggle Mobile Menu
  menuToggle.addEventListener("click", toggleMobileMenu);

  // Event Listener: Close Mobile Menu When Clicking on Overlay
  mobileMenuOverlay.addEventListener("click", closeMobileMenu);

  // Event Listener: Close Mobile Menu When Clicking on a Navigation Link
  mobileMenu.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (link) {
      closeMobileMenu();
    }
  });

  // Event Listener: Close Mobile Menu When Pressing the Escape Key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mobileMenu.classList.contains("open")) {
      closeMobileMenu();
    }
  });

  // Event Listener: Handle Keyboard Accessibility for Menu Toggle Button
  menuToggle.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleMobileMenu();
    }
  });
}

/**
 * Initialize Smooth Scrolling (Only on index.html)
 */
function initializeSmoothScrolling() {
  // Check if the current page is index.html
  const isIndexPage =
    window.location.pathname === "/" ||
    window.location.pathname === "/index.html";

  if (!isIndexPage) return; // Exit if not on index.html

  const navLinks = document.querySelectorAll('a.nav-link[href^="/index.html#"]');

  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href").split("#")[1];
      const targetSection = document.getElementById(targetId);

      if (targetSection) {
        const navbarHeight = document.querySelector(".desktop-menu").offsetHeight;
        const targetPosition =
          targetSection.getBoundingClientRect().top +
          window.pageYOffset -
          navbarHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });

        // Update the URL hash without causing a jump
        history.pushState(null, null, `#${targetId}`);
      }
    });
  });

  // Handle page load with hash (smooth scroll if on index.html)
  if (window.location.hash) {
    const targetId = window.location.hash.substring(1);
    const targetSection = document.getElementById(targetId);

    if (targetSection) {
      // Use a timeout to ensure the page has fully loaded
      setTimeout(() => {
        const navbarHeight = document.querySelector(".desktop-menu").offsetHeight;
        const targetPosition =
          targetSection.getBoundingClientRect().top +
          window.pageYOffset -
          navbarHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });
      }, 100); // Adjust delay as necessary
    }
  }
}

/**
 * Initialize Active Section Highlighting
 */
function initializeActiveSectionHighlighting() {
  // Check if the current page is index.html
  const isIndexPage =
    window.location.pathname === "/" ||
    window.location.pathname === "/index.html";

  if (!isIndexPage) return; // Exit if not on index.html

  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll('a.nav-link[href^="/index.html#"]');

  window.addEventListener(
    "scroll",
    debounce(() => {
      let current = "";

      sections.forEach((section) => {
        const sectionTop = section.offsetTop - 150; // Adjust as needed
        if (pageYOffset >= sectionTop) {
          current = section.getAttribute("id");
        }
      });

      navLinks.forEach((link) => {
        link.classList.remove("active");
        if (link.getAttribute("href") === `/index.html#${current}`) {
          link.classList.add("active");
        }
      });
    }, 100)
  );
}

/**
 * Toggle Mobile Menu Open/Close
 */
function toggleMobileMenu() {
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileMenu = document.querySelector(".mobile-menu");
  const mobileMenuOverlay = document.getElementById("mobileMenuOverlay");

  const isOpen = mobileMenu.classList.toggle("open");
  mobileMenu.setAttribute("aria-hidden", !isOpen);
  menuToggle.setAttribute("aria-expanded", isOpen);
  mobileMenuOverlay.classList.toggle("active", isOpen);

  if (isOpen) {
    // Optionally, trap focus within the mobile menu
    trapFocus(mobileMenu);
  } else {
    // Release focus if needed
    releaseFocus();
  }
}

/**
 * Close Mobile Menu
 */
function closeMobileMenu() {
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileMenu = document.querySelector(".mobile-menu");
  const mobileMenuOverlay = document.getElementById("mobileMenuOverlay");

  mobileMenu.classList.remove("open");
  mobileMenu.setAttribute("aria-hidden", "true");
  menuToggle.setAttribute("aria-expanded", "false");
  mobileMenuOverlay.classList.remove("active");

  // Release focus if trapped
  releaseFocus();
}

/**
 * Trap Focus Within the Mobile Menu for Accessibility
 */
let focusedElementBeforeMenu;

function trapFocus(menu) {
  const focusableSelectors = 'a[href], button:not([disabled]), textarea, input, select, [tabindex="0"]';
  const focusableElements = menu.querySelectorAll(focusableSelectors);
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  if (focusableElements.length === 0) return;

  focusedElementBeforeMenu = document.activeElement;
  firstFocusable.focus();

  function handleFocusTrap(e) {
    if (e.key !== "Tab") return;

    if (e.shiftKey) { // Shift + Tab
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else { // Tab
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  }

  menu.addEventListener("keydown", handleFocusTrap);

  // Store the handler to remove it later
  menu._handleFocusTrap = handleFocusTrap;
}

/**
 * Release Focus and Return to Previously Focused Element
 */
function releaseFocus() {
  const mobileMenu = document.querySelector(".mobile-menu");
  if (mobileMenu && mobileMenu._handleFocusTrap) {
    mobileMenu.removeEventListener("keydown", mobileMenu._handleFocusTrap);
    mobileMenu._handleFocusTrap = null;
  }

  if (focusedElementBeforeMenu) {
    focusedElementBeforeMenu.focus();
    focusedElementBeforeMenu = null;
  }
}

/**
 * Debounce Function to Optimize Scroll Event Listener
 */
function debounce(func, wait = 20, immediate = true) {
  let timeout;
  return function () {
    const context = this,
      args = arguments;
    const later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}
