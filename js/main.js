// main.js

document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileMenu = document.querySelector(".mobile-menu");
  const mobileMenuOverlay = document.getElementById("mobileMenuOverlay");

  if (menuToggle && mobileMenu && mobileMenuOverlay) {
    menuToggle.addEventListener("click", () => {
      const isOpen = mobileMenu.classList.toggle("open");
      mobileMenu.setAttribute("aria-hidden", !isOpen);
      menuToggle.setAttribute("aria-expanded", isOpen);
      mobileMenuOverlay.classList.toggle("active", isOpen);
    });

    // Close menu when clicking on the overlay
    mobileMenuOverlay.addEventListener("click", () => {
      mobileMenu.classList.remove("open");
      mobileMenu.setAttribute("aria-hidden", "true");
      menuToggle.setAttribute("aria-expanded", "false");
      mobileMenuOverlay.classList.remove("active");
    });

    // Allow menu toggle via keyboard
    menuToggle.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        menuToggle.click();
      }
    });
  }

  // Smooth Scroll for Anchor Links
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
        if (mobileMenu.classList.contains("open")) {
          mobileMenu.classList.remove("open");
          mobileMenu.setAttribute("aria-hidden", "true");
          menuToggle.setAttribute("aria-expanded", "false");
          mobileMenuOverlay.classList.remove("active");
        }
      }
    });
  });
});
