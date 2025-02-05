// navbar.js

document.addEventListener("DOMContentLoaded", () => {


  loadNavbar()
    .then(initializeNavbar)
    .then(initializeSmoothScrolling)
    .then(initializeActiveSectionHighlighting)
    .then(darkMode)
    .then(toggleTheme);

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




function toggleTheme() {
  if (localStorage.getItem("theme-toggle") === "true") {
    document.getElementById("theme-select").style.display = "inline-block";
  }
  const themeSelect = document.getElementById('theme-select');
  const root = document.documentElement;
  
  if (localStorage.getItem('colorTheme')) {
    const savedTheme = localStorage.getItem('colorTheme');
    themeSelect.value = savedTheme;
    if (savedTheme !== 'default') {
      root.setAttribute('data-color-theme', savedTheme);
    } else {
      root.removeAttribute('data-color-theme');
    }
  }
  
  themeSelect.addEventListener('change', () => {
    const selectedTheme = themeSelect.value;
    if (selectedTheme === 'default') {
      root.removeAttribute('data-color-theme');
    } else {
      root.setAttribute('data-color-theme', selectedTheme);
    }
    localStorage.setItem('colorTheme', selectedTheme);
  });
  

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
