// modals.js

document.addEventListener("DOMContentLoaded", () => {
  loadModals()
    .then(() => {
      setupModalEventListeners();
      console.log("Modals loaded and event listeners set up.");
      // Dispatch the custom event after modals are loaded
      const modalsLoadedEvent = new Event("modalsLoaded");
      document.dispatchEvent(modalsLoadedEvent);
    })
    .catch((error) => console.error("Error loading modals:", error));
});

/**
 * Load modals.html and append its content to the body
 */
function loadModals() {
  const loadModalFile = (url) => {
    return fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
        }
        return response.text();
      });
  };

  return Promise.all([loadModalFile("/modals.html"), loadModalFile("/bookingModal.html")])
    .then(([modalsData, bookingModalData]) => {
      const modalContainer = document.createElement("div");
      modalContainer.innerHTML = modalsData + bookingModalData;
      document.body.appendChild(modalContainer);
      console.log("modals.html and bookingModal.html loaded into the DOM.");
    });
}

/**
 * Setup Event Listeners for Modal Interactions using Event Delegation
 */
function setupModalEventListeners() {
  // Function to open a modal
  window.openModal = function (modalId) {
    const modalBg = document.getElementById(modalId);
    // console.log("opening modal", modalId);
    if (modalBg) {
      modalBg.style.display = "flex";
      modalBg.classList.add("active"); // Optional: Add active class for additional styling
      document.body.classList.add("modal-open");
      trapFocus(modalBg);
      console.log(`Modal "${modalId}" opened.`);
    } else {
      console.warn(`Modal with ID "${modalId}" not found.`);
    }
  };

  // Function to close a modal
  window.closeModal = function (modalBg) {
    if (modalBg) {
      modalBg.style.display = "none";
      modalBg.classList.remove("active"); // Remove active class
      document.body.classList.remove("modal-open");
      releaseFocus();
      console.log(`Modal "${modalBg.id}" closed.`);
    }
  };

  // Event Listener for opening modals (Delegated)
  document.addEventListener("click", (e) => {
    let classButtons = "[id^='open'], .learn-more-btn, .learn-more-blog-btn"
    const MODAL_BOOKING_FORM = false;
    if (MODAL_BOOKING_FORM)
      classButtons += ", " + ".cta-button.book-now";
    const button = e.target.closest(classButtons);
    if (button) {
      let modalId = "";

      // Explicitly handle known modal triggers
      if (button.id === "openTermsModal") {
        modalId = "termsModal";
      } else if (button.id === "openPrivacyModal") {
        modalId = "privacyModal";
      } else if (button.id === "openModal" || button.classList.contains("book-now")) {
        modalId = "modalBg";
      } else if (button.classList.contains("learn-more-btn")) {
        const service = button.getAttribute("data-service");
        modalId = `serviceModal${service}`;
      } else if (button.classList.contains("learn-more-blog-btn")) {
        const blog = button.getAttribute("data-blog");
        modalId = `blogModal${blog}`;
      } else if (button.classList.contains("cta-button") && button.classList.contains("book-now")) {
        // Handle 'Book Now' within service modals
        const serviceModal = button.closest(".service-modal");
        if (serviceModal) {
          const serviceName = serviceModal.querySelector("h2").innerText;
          closeModal(serviceModal);
          modalId = "modalBg";
          openModal(modalId);
          const serviceSelect = document.getElementById("service");
          if (serviceSelect) {
            serviceSelect.value = serviceName;
            console.log(`Service "${serviceName}" pre-filled in booking form.`);
          }
        }
      }

      if (modalId) {
        e.preventDefault();
        openModal(modalId);
      }
    }
  });

  // Event Listener for closing modals (Delegated)
  document.addEventListener("click", (e) => {
    if (e.target.matches(".modal-close")) {
      const modalBg = e.target.closest(".modal-bg");
      if (modalBg) {
        closeModal(modalBg);
      }
    }
  });

  // Close modal when clicking outside the modal content
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-bg")) {
      closeModal(e.target);
    }
  });

  // Close modal on Escape key press
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const openModals = document.querySelectorAll(".modal-bg.active");
      openModals.forEach((modalBg) => {
        closeModal(modalBg);
      });
    }
  });

  // Setup event listeners for "Learn More" service buttons
  const learnMoreButtons = document.querySelectorAll(".learn-more-btn");
  learnMoreButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const service = button.getAttribute("data-service");
      const modalId = `serviceModal${service}`;
      openModal(modalId);
    });
  });

  // Setup event listeners for "Read More" blog buttons
  const readMoreBlogButtons = document.querySelectorAll(".learn-more-blog-btn");
  readMoreBlogButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const blog = button.getAttribute("data-blog");
      const modalId = `blogModal${blog}`;
      openModal(modalId);
    });
  });

  // Setup event listeners for "Book Now" buttons within service modals
  const bookNowButtons = document.querySelectorAll(".cta-button.book-now");
  bookNowButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const serviceModal = button.closest(".service-modal");
      if (serviceModal) {
        // Get service name from the modal’s <h2>
        const serviceName = serviceModal.querySelector("h2").innerText;
        // Close the current service modal
        closeModal(serviceModal);
        // Open booking modal
        openModal("modalBg");
        // Pre-fill the service selection
        const serviceSelect = document.getElementById("service");
        if (serviceSelect) {
          serviceSelect.value = serviceName;
        }
      }
    });
  });

}

/**
 * Trap focus within the modal for accessibility
 */
let focusedElementBeforeModal;

function trapFocus(modal) {
  const focusableElementsString =
    'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';
  const focusableElements = modal.querySelectorAll(focusableElementsString);

  if (focusableElements.length === 0) return;

  const firstFocusableElement = focusableElements[0];
  const lastFocusableElement = focusableElements[focusableElements.length - 1];

  focusedElementBeforeModal = document.activeElement;

  function handleFocus(e) {
    if (e.key !== "Tab") return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusableElement) {
        e.preventDefault();
        lastFocusableElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusableElement) {
        e.preventDefault();
        firstFocusableElement.focus();
      }
    }
  }

  modal.addEventListener("keydown", handleFocus);
  firstFocusableElement.focus();

  // Store the handler to remove later
  modal._handleFocus = handleFocus;
}

/**
 * Release focus and return to the previously focused element
 */
function releaseFocus() {
  const modal = document.querySelector(".modal-bg.active");
  if (modal && modal._handleFocus) {
    modal.removeEventListener("keydown", modal._handleFocus);
    if (focusedElementBeforeModal) focusedElementBeforeModal.focus();
  }
}
