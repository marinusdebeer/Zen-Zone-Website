// js/bookingForm.js

document.addEventListener("modalsLoaded", () => {
  initBookingForm();
});

/**
 * Initialize Booking Form Functionality
 */
function initBookingForm() {

   // Event Listener for closing modals (Delegated)
   document.addEventListener("click", (e) => {
    if (e.target.matches(".booking-modal-close")) {
      const modalBg = e.target.closest(".booking-modal-bg");
      if (modalBg) {
        closeModal(modalBg);
      }
    }
  });
  
  const bookingForm = document.getElementById("bookingForm");
  if (!bookingForm) {
    console.error("Booking form not found.");
    return;
  }

  const formSteps = bookingForm.querySelectorAll(".booking-form-step");
  const progressBar = document.querySelector(".booking-progress");
  const submitButton = bookingForm.querySelector(".booking-btn-submit");

  let currentStep = 1;
  const totalSteps = formSteps.length;

  // Initialize EmailJS
  emailjs.init("9CwBWUPI_pCtZXPr0");

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

  // Show the first step
  showFormStep(currentStep);

  // Event delegation for next and previous buttons
  bookingForm.addEventListener("click", (e) => {
    if (e.target.classList.contains("booking-btn-next")) {
      e.preventDefault();
      if (validateFormStep(currentStep)) {
        currentStep++;
        showFormStep(currentStep);
      }
    }

    if (e.target.classList.contains("booking-btn-prev")) {
      e.preventDefault();
      currentStep--;
      showFormStep(currentStep);
    }
  });

  // Handle form submission
  bookingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (validateFormStep(currentStep)) {
      // Collect form data
      const formData = new FormData(bookingForm);
      const data = Object.fromEntries(formData.entries());

      // Send data via EmailJS
      sendBookingRequest(data);

      // Send data to Google Apps Script for tracking
      sendData("submit", "submitClicked");
    }
  });

  /**
   * Show the form step based on index
   */
  function showFormStep(step) {
    formSteps.forEach((formStep, index) => {
      formStep.classList.toggle("booking-form-step--active", index + 1 === step);
    });

    // Update progress bar
    const progressPercent = ((step - 1) / (totalSteps - 1)) * 100;
    if (progressBar) {
      progressBar.style.width = `${progressPercent}%`;
    }
  }

  /**
   * Validate current form step
   */
  function validateFormStep(step) {
    const currentFormStep = formSteps[step - 1];
    const inputs = currentFormStep.querySelectorAll("input, select, textarea");
    let valid = true;

    inputs.forEach((input) => {
      if (!input.checkValidity()) {
        valid = false;
        input.reportValidity();
        console.warn(`Invalid input: ${input.name}`);
      }
    });

    return valid;
  }

  /**
   * Reset the form to the first step
   */
  function resetForm() {
    currentStep = 1;
    showFormStep(currentStep);
    bookingForm.reset();
    if (progressBar) {
      progressBar.style.width = "0%";
    }
  }

  /**
   * Send booking request using EmailJS
   */
  function sendBookingRequest(data) {
    // Disable submit button to prevent multiple submissions
    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    // Prepare the EmailJS service for admin notification
    emailjs
      .send("service_156d2p8", "template_i7i7zz7", { ...data, message: constructAdminMessage(data) })
      .then(() => {
        // Prepare and send confirmation email to user
        const confirmationData = {
          to_name: data.name,
          to_email: data.email,
          service: data.service,
          date: data.date,
          message: constructUserMessage(data),
        };

        return emailjs.send("service_156d2p8", "template_nrcx4ff", confirmationData);
      })
      .then(() => {
        // Show success modal
        showStatusModal(
          "Your request has been submitted successfully. We will contact you shortly.",
          true
        );
        resetForm();
        closeModal(document.getElementById("modalBg"));
      })
      .catch((error) => {
        console.error("Error:", error.text || error);
        // Show error modal
        showStatusModal("Failed to submit your request. Please try again later.", false);
      })
      .finally(() => {
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.textContent = "Request Quote";
      });
  }

  /**
   * Construct the admin message from form data
   */
  function constructAdminMessage(data) {
    return `
Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone}
Service: ${data.service}
Square Footage: ${data.squareFootage} sq ft
Bedrooms: ${data.bedrooms}
Bathrooms: ${data.bathrooms}
Powder Rooms: ${data.powderRooms}
Address: ${data.address}
Preferred Date: ${data.date}
Additional Details: ${data.details || "N/A"}
    `.trim();
  }

  /**
   * Construct the user confirmation message
   */
  function constructUserMessage(data) {
    return `
Thank you for choosing Zen Zone Cleaning Services! Here’s a summary of your request:

Service: ${data.service}
Preferred Date: ${data.date}
Address: ${data.address}
Square Footage: ${data.squareFootage} sq ft
Bedrooms: ${data.bedrooms}
Bathrooms: ${data.bathrooms}
Powder Rooms: ${data.powderRooms}

Additional Details: ${data.details || "None provided"}
    `.trim();
  }

  /**
   * Show status modal with message
   */
  function showStatusModal(message, isSuccess) {
    const statusModalBg = document.getElementById("statusModalBg");
    const statusModalContent = document.getElementById("statusModalContent");

    statusModalContent.innerHTML = `
      <h2>${isSuccess ? "Success" : "Error"}</h2>
      <p>${message}</p>
    `;

    openModal("statusModalBg");

    // Automatically close after 5 seconds
    setTimeout(() => {
      closeModal(statusModalBg);
    }, 5000);
  }

  /**
   * Send data to Google Apps Script for tracking
   */
  async function sendData(fieldId, action = null) {
    const field = document.getElementById(fieldId);
    let value;

    if (action === "submitClicked") {
      value = "Submitted"; // Special value for the submit button action
    } else if (field && field.type === "range") {
      value = field.value; // Get the slider's current value
    } else if (field) {
      value = field.value.trim(); // Get value for other input types
    } else {
      console.warn(`Field with ID "${fieldId}" not found.`);
      return;
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
  submitButton.addEventListener("click", () => {
    sendData("submit", "submitClicked");
  });
}
