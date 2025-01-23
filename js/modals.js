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
  return fetch("/modals.html")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load modals.html: ${response.status} ${response.statusText}`);
      }
      return response.text();
    })
    .then((data) => {
      const modalContainer = document.createElement("div");
      modalContainer.innerHTML = data;
      document.body.appendChild(modalContainer);
      console.log("modals.html loaded into the DOM.");
    });
}

/**
 * Setup Event Listeners for Modal Interactions using Event Delegation
 */
function setupModalEventListeners() {
  // Function to open a modal
  window.openModal = function (modalId) {
    const modalBg = document.getElementById(modalId);
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
    const button = e.target.closest("[id^='open'], .book-now, .learn-more-btn, .learn-more-blog-btn, .cta-button.book-now");
    if (button) {
      let modalId = "";

      // Explicitly handle known modal triggers
      if (button.id === "openTermsModal") {
        modalId = "termsModal";
      } else if (button.id === "openPrivacyModal") {
        modalId = "privacyModal";
      } else if (button.id === "openModal" || button.id === "openModal2" || button.classList.contains("book-now")) {
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
      const openModals = document.querySelectorAll(".modal-bg[style*='display: flex']");
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

  // Generate a unique ID for the user on page load
  const userId = localStorage.getItem("uniqueId") || `user-${Date.now()}`;
  localStorage.setItem("uniqueId", userId);

  // Debounce utility function
  function debounce(func, delay) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // Function to send data to Google Apps Script
  async function sendData(fieldId, action = null) {
    const field = document.getElementById(fieldId);
    let value;

    if (action === "submitClicked") {
      value = "Submitted"; // Special value for the submit button action
    } else if (field.type === "range") {
      value = field.value; // Get the slider's current value
    } else {
      value = field.value.trim(); // Get value for other input types
    }

    if (!value) return;

    const data = {
      userId, // Include unique user ID
      fieldId: action || fieldId, // If it's a submit action, send "submitClicked"
      value, // The field's value
    };

    try {
      const response = await fetch("https://script.google.com/macros/s/AKfycbx5RXzUMFjXjxANpN1oOAj3H6YBjV6XzReF8SLCCVJqK54szwLS0JxHi-SyJE6zQqA0/exec", {
        redirect: "follow",
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8", // Specified header
        },
        body: JSON.stringify(data), // Convert the object to a JSON string
      });

      if (response.ok) {
        console.log(`Data sent successfully for ${fieldId}`);
      } else {
        console.error(`Failed to send data for ${fieldId}:`, response.status);
      }
    } catch (error) {
      console.error(`Error sending data for ${fieldId}:`, error);
    }
  }

  // Add event listeners to form fields
  [
    { id: "name", event: "blur" },
    { id: "email", event: "blur" },
    { id: "phone", event: "blur" },
    { id: "service", event: "change" }, // For dropdowns
    { id: "squareFootage", event: "input", debounce: true }, // For sliders
    { id: "bedrooms", event: "input", debounce: true }, // For sliders
    { id: "bathrooms", event: "input", debounce: true }, // For sliders
    { id: "powderRooms", event: "input", debounce: true }, // For sliders
    { id: "address", event: "blur" },
    { id: "date", event: "blur" },
    { id: "details", event: "blur" },
  ].forEach(({ id, event, debounce: shouldDebounce }) => {
    const field = document.getElementById(id);
    if (field) {
      const handler = shouldDebounce ? debounce(() => sendData(id), 300) : () => sendData(id);
      field.addEventListener(event, handler);
    }
  });

  // Log when the user clicks the Submit button
  document.querySelector(".submit-btn").addEventListener("click", () => {
    sendData("submit", "submitClicked");
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
  const modal = document.querySelector(".modal-bg[style*='display: flex']");
  if (modal && modal._handleFocus) {
    modal.removeEventListener("keydown", modal._handleFocus);
    if (focusedElementBeforeModal) focusedElementBeforeModal.focus();
  }
}
