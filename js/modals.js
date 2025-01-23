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
  return fetch("modals.html")
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

      if (button.id === "openModal" || button.id === "openModal2" || button.classList.contains("book-now")) {
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

  // Event Listener for form field interactions (Delegated)
  document.addEventListener("input", (e) => {
    const field = e.target;
    const debounceFields = ["squareFootage", "bedrooms", "bathrooms", "powderRooms"];
    if (debounceFields.includes(field.id) && (e.type === "input")) {
      debounce(() => sendData(field.id), 300)();
    }
  });

  document.addEventListener("blur", (e) => {
    const field = e.target;
    const blurFields = ["name", "email", "phone", "address", "date", "details"];
    if (blurFields.includes(field.id)) {
      sendData(field.id);
    }
  }, true); // Use capture to catch the blur event

  document.addEventListener("change", (e) => {
    const field = e.target;
    if (field.id === "service") {
      sendData(field.id);
    }
  });

  // Event Listener for Submit button (Delegated)
  document.addEventListener("click", (e) => {
    if (e.target.matches(".submit-btn")) {
      sendData("submit", "submitClicked");
    }
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
