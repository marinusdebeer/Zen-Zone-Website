// navbar.js

document.addEventListener("DOMContentLoaded", () => {
  loadNavbar().then(initializeNavbar);
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
