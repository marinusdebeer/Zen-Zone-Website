// main.js

document.addEventListener("DOMContentLoaded", () => {
  initializeSmoothScroll();
});

/**
 * Initialize Smooth Scrolling for Anchor Links
 */
function initializeSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');
  const navbar = document.querySelector('.navbar'); // Adjust selector if different

  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        e.preventDefault(); // Prevent default jump

        // Dynamically get the height of the navbar
        const navbarHeight = navbar ? navbar.offsetHeight : 0;

        // Get the target element's position
        const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY;

        // Smooth scroll to the adjusted position
        window.scrollTo({
          top: targetPosition - navbarHeight + 30, // Offset by the navbar's height
          behavior: 'smooth',
        });

        // Close the mobile menu if it's open
        const mobileMenu = document.querySelector(".mobile-menu");
        const menuToggle = document.querySelector(".menu-toggle");
        const mobileMenuOverlay = document.getElementById("mobileMenuOverlay");

        if (mobileMenu && mobileMenu.classList.contains("open")) {
          mobileMenu.classList.remove("open");
          mobileMenu.setAttribute("aria-hidden", "true");
          if (menuToggle) {
            menuToggle.setAttribute("aria-expanded", "false");
          }
          if (mobileMenuOverlay) {
            mobileMenuOverlay.classList.remove("active");
          }

          // Release focus if trapped
          releaseFocus();
        }
      }
    });
  });
}

/**
 * Release Focus and Return to Previously Focused Element
 * (Reusing the function from navbar.js if possible)
 */
function releaseFocus() {
  const mobileMenu = document.querySelector(".mobile-menu");
  if (mobileMenu && mobileMenu._handleFocusTrap) {
    mobileMenu.removeEventListener("keydown", mobileMenu._handleFocusTrap);
    mobileMenu._handleFocusTrap = null;
  }

  // Assuming `focusedElementBeforeMenu` is accessible or redefine it
  // For better encapsulation, consider handling focus trapping entirely within navbar.js
}
