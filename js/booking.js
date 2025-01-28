// booking.js

document.addEventListener("DOMContentLoaded", () => {
  BookingForm.init();
});

/**
 * BookingForm Module
 * Handles step navigation, form validation, form submission,
 * toast notifications, and dynamic step summaries.
 */
const BookingForm = (() => {
  // Elements
  const bookingForm = document.getElementById("bookingForm");
  const formSteps = Array.from(document.querySelectorAll(".booking-form-step"));
  const toast = document.getElementById("toast");
  const toastBody = toast?.querySelector(".toast-body");
  const submitButton = bookingForm?.querySelector(".booking-btn-submit");
  const bookingFormTitle = document.getElementById("bookingFormTitle");

  // State
  let currentStep = 1;
  const totalSteps = formSteps.length;
  const userId = localStorage.getItem("uniqueId") || `user-${Date.now()}`;
  localStorage.setItem("uniqueId", userId); // Ensure it's stored for future reference

  /**
   * Initialize the BookingForm module
   */
  const init = () => {
    // Display the first step
    showFormStep(currentStep);

    // Attach Event Listeners
    attachEventListeners();

    // Initialize Step Tracker Clickability
    initializeStepTrackerClick();

    // Initialize Range Input Displays
    initializeRangeDisplays();
  };

  /**
   * Attach necessary event listeners to the form
   */
  const attachEventListeners = () => {
    if (!bookingForm) return;

    // Handle Next and Previous button clicks
    bookingForm.addEventListener("click", handleButtonClick);

    // Handle form submission
    bookingForm.addEventListener("submit", handleFormSubmit);

    // Handle blur and input events for each input to send data to Google Script
    const inputs = Array.from(bookingForm.querySelectorAll("input, select, textarea"));
    inputs.forEach((input) => {
      // For range inputs, listen to 'input' events
      if (input.type === "range") {
        input.addEventListener("input", handleSliderChange);
      } else {
        // For other inputs, listen to 'blur' events
        input.addEventListener("blur", handleFieldBlur);
      }
    });

    // Handle submit button click to send tracking data
    if (submitButton) {
      submitButton.addEventListener("click", () => {
        Tracking.sendTrackingData("submission", "Form Submitted");
      });
    }
  };

  /**
   * Handle Next and Previous button clicks
   * @param {Event} e 
   */
  const handleButtonClick = (e) => {
    if (e.target.classList.contains("booking-btn-next")) {
      e.preventDefault();
      if (validateFormStep(currentStep)) {
        updateStepTracker(currentStep);
        currentStep++;
        showFormStep(currentStep);
      }
    }

    if (e.target.classList.contains("booking-btn-prev")) {
      e.preventDefault();
      currentStep--;
      if (currentStep < 1) currentStep = 1;
      showFormStep(currentStep);
    }
  };

  /**
   * Handle form submission
   * @param {Event} e 
   */
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (validateFormStep(currentStep)) {
      const formData = new FormData(bookingForm);
      const data = Object.fromEntries(formData.entries());

      // Update step tracker with last step's data
      updateStepTracker(currentStep);

      // Send data via EmailJS
      Email.sendBookingRequest(data)
        .then(() => {
          showToast("Your request has been submitted successfully. We will contact you shortly.", true);
          resetForm();
          // Redirect to thank you page after a short delay
          setTimeout(() => {
            window.location.href = "/thankyou.html";
          }, 2000);
        })
        .catch((error) => {
          showToast("Failed to submit your request. Please try again later.", false);
        });
    }
  };

  /**
   * Handle field blur event to send data to Google Script
   * @param {Event} e 
   */
  const handleFieldBlur = (e) => {
    const fieldId = e.target.id;
    const value = e.target.value.trim();
    const processedFieldId = fieldId.replace("booking-", ""); // Remove "booking-" prefix
    Tracking.sendTrackingData(processedFieldId, value);
  };

  /**
   * Handle slider input event to send data to Google Script
   * @param {Event} e 
   */
  const handleSliderChange = (e) => {
    const fieldId = e.target.id;
    const value = e.target.value;
    const processedFieldId = fieldId.replace("booking-", ""); // Remove "booking-" prefix
    Tracking.sendTrackingData(processedFieldId, value);
  };

  /**
   * Validate all input fields in the current step
   * @param {number} step 
   * @returns {boolean}
   */
  const validateFormStep = (step) => {
    const currentFormStep = formSteps[step - 1];
    if (!currentFormStep) return true;

    const inputs = Array.from(currentFormStep.querySelectorAll("input, select, textarea"));
    let valid = true;

    inputs.forEach((input) => {
      if (!input.checkValidity()) {
        valid = false;
        input.classList.add("border-red-500"); // Example utility class for error
        input.reportValidity();
      } else {
        input.classList.remove("border-red-500");
      }
    });

    if (!valid) {
      showToast("Please correct the errors on this step before proceeding.", false);
    }

    return valid;
  };

  /**
   * Show the specified form step
   * @param {number} step 
   */
  const showFormStep = (step) => {
    formSteps.forEach((formStep, index) => {
      formStep.classList.toggle("booking-form-step--active", index + 1 === step);
      formStep.setAttribute("aria-hidden", index + 1 !== step);
    });

    // Update main heading
    const currentStepElement = document.querySelector(`.booking-step[data-step="${step}"]`);
    if (currentStepElement) {
      const stepLabel = currentStepElement.querySelector(".booking-step-label").textContent;
      bookingFormTitle.textContent = stepLabel;
    }

    // Update step tracker UI
    updateStepTrackerUI(step);

    // Update clickable steps in the tracker
    updateClickableSteps(step);
  };

  /**
   * Update the step tracker UI based on the current step
   * @param {number} step 
   */
  const updateStepTrackerUI = (step) => {
    const progressSteps = Array.from(document.querySelectorAll(".booking-step"));
    progressSteps.forEach((stepElement) => {
      const stepNumber = parseInt(stepElement.getAttribute("data-step"), 10);

      if (stepNumber < step) {
        stepElement.classList.add("completed");
        stepElement.classList.remove("active", "incomplete");
        stepElement.removeAttribute("aria-current");
      } else if (stepNumber === step) {
        stepElement.classList.add("active");
        stepElement.classList.remove("completed", "incomplete");
        stepElement.setAttribute("aria-current", "step");
      } else {
        stepElement.classList.add("incomplete");
        stepElement.classList.remove("active", "completed");
        stepElement.removeAttribute("aria-current");
      }
    });
  };

  /**
   * Update which steps are clickable based on the highest completed step
   * @param {number} step 
   */
  const updateClickableSteps = (step) => {
    const progressSteps = Array.from(document.querySelectorAll(".booking-step"));
    progressSteps.forEach((stepElement) => {
      const stepNumber = parseInt(stepElement.getAttribute("data-step"), 10);
      stepElement.classList.remove("clickable");
      stepElement.setAttribute("aria-disabled", "true");
    });

    // Mark all completed steps as clickable
    let highestCompleted = getHighestCompletedStep();
    progressSteps.forEach((stepElement) => {
      const stepNumber = parseInt(stepElement.getAttribute("data-step"), 10);
      if (stepNumber <= highestCompleted) {
        stepElement.classList.add("clickable");
        stepElement.setAttribute("aria-disabled", "false");
      }
    });
  };

  /**
   * Get the highest completed step
   * @returns {number}
   */
  const getHighestCompletedStep = () => {
    const progressSteps = Array.from(document.querySelectorAll(".booking-step"));
    let highest = 0;
    progressSteps.forEach((stepElement) => {
      if (stepElement.classList.contains("completed")) {
        const stepNum = parseInt(stepElement.getAttribute("data-step"), 10);
        if (stepNum > highest) {
          highest = stepNum;
        }
      }
    });
    return highest;
  };

  /**
   * Update the step tracker with data from completed steps
   * @param {number} step 
   */
  const updateStepTracker = (step) => {
    const data = {};

    switch (step) {
      case 1:
        data.name = document.getElementById("booking-name").value.trim();
        data.email = document.getElementById("booking-email").value.trim();
        data.phone = document.getElementById("booking-phone").value.trim();
        appendStepData(step, data);
        break;
      case 2:
        data.service = document.getElementById("booking-service").value.trim();
        appendStepData(step, data);
        break;
      case 3:
        data.squareFootage = document.getElementById("booking-squareFootage").value;
        data.bedrooms = document.getElementById("booking-bedrooms").value;
        data.bathrooms = document.getElementById("booking-bathrooms").value;
        data.powderRooms = document.getElementById("booking-powderRooms").value;
        appendStepData(step, data);
        break;
      case 4:
        data.address = document.getElementById("booking-address").value.trim();
        data.date = document.getElementById("booking-date").value;
        data.details = document.getElementById("booking-details").value.trim() || "N/A";
        appendStepData(step, data);
        break;
      default:
        break;
    }

    // Send tracking data for each field
    Object.entries(data).forEach(([fieldId, value]) => {
      Tracking.sendTrackingData(fieldId, value);
    });
  };

  /**
   * Append summarized data to the step tracker
   * @param {number} step 
   * @param {object} data 
   */
  const appendStepData = (step, data) => {
    const stepElement = document.querySelector(`.booking-step[data-step="${step}"]`);
    if (!stepElement) return;

    let fieldValue = "";
    switch (step) {
      case 1:
        fieldValue = `
          <div class="step-value">
            <strong>Full Name:</strong> ${sanitizeHTML(data.name)}<br>
            <strong>Email:</strong> ${sanitizeHTML(data.email)}<br>
            <strong>Phone:</strong> ${sanitizeHTML(data.phone)}
          </div>
        `;
        break;
      case 2:
        fieldValue = `
          <div class="step-value">
            <strong>Service:</strong> ${sanitizeHTML(data.service)}
          </div>
        `;
        break;
      case 3:
        fieldValue = `
          <div class="step-value">
            <strong>Square Footage:</strong> ${sanitizeHTML(data.squareFootage)} sq ft<br>
            <strong>Bedrooms:</strong> ${sanitizeHTML(data.bedrooms)}<br>
            <strong>Bathrooms:</strong> ${sanitizeHTML(data.bathrooms)}<br>
            <strong>Powder Rooms:</strong> ${sanitizeHTML(data.powderRooms)}
          </div>
        `;
        break;
      case 4:
        fieldValue = `
          <div class="step-value">
            <strong>Address:</strong> ${sanitizeHTML(data.address)}<br>
            <strong>Preferred Date:</strong> ${sanitizeHTML(data.date)}<br>
            <strong>Additional Details:</strong> ${sanitizeHTML(data.details)}
          </div>
        `;
        break;
      default:
        break;
    }

    // Remove existing data if any
    const existingStepValue = stepElement.querySelector(".step-summary .step-value");
    if (existingStepValue) existingStepValue.remove();
    console.log(stepElement.classList.value);
    // Only append data if step is completed
    // if (stepElement.classList.contains("completed")) {
      // console.log(fieldValue);
      stepElement.querySelector(".step-summary").insertAdjacentHTML("beforeend", fieldValue);
    // }
  };

  /**
   * Sanitize HTML to prevent XSS
   * @param {string} str 
   * @returns {string}
   */
  const sanitizeHTML = (str) => {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
  };

  /**
   * Show a toast notification
   * @param {string} message 
   * @param {boolean} isSuccess 
   */
  const showToast = (message, isSuccess) => {
    if (!toast || !toastBody) return;

    toastBody.textContent = message;
    toast.className = "toast"; // Reset classes
    toast.classList.add(isSuccess ? "success" : "error");
    toast.hidden = false;

    // Trigger reflow to restart CSS animation
    void toast.offsetWidth;
    toast.classList.add("show");

    // Automatically hide after 5 seconds
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        toast.hidden = true;
      }, 500);
    }, 5000);
  };

  /**
   * Initialize click events for step tracker steps
   */
  const initializeStepTrackerClick = () => {
    const progressSteps = Array.from(document.querySelectorAll(".booking-step"));
    progressSteps.forEach((stepElement) => {
      stepElement.addEventListener("click", () => {
        const step = parseInt(stepElement.getAttribute("data-step"), 10);
        if (canNavigateToStep(step)) {
          currentStep = step;
          showFormStep(currentStep);
        }
      });

      // Keyboard navigation for accessibility
      stepElement.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          stepElement.click();
        }
      });
    });
  };

  /**
   * Determine if user can navigate to a specific step
   * @param {number} step 
   * @returns {boolean}
   */
  const canNavigateToStep = (step) => {
    const highestCompleted = getHighestCompletedStep();
    if (step <= highestCompleted + 1) { // Allow navigating to completed steps and the immediate next step
      return true;
    }
    return false;
  };

  /**
   * Initialize range input displays
   */
  const initializeRangeDisplays = () => {
    const rangeInputs = Array.from(document.querySelectorAll(".booking-form-step input[type='range']"));
    rangeInputs.forEach((input) => {
      const display = document.getElementById(`${input.id}Value`);
      if (display) {
        input.addEventListener("input", () => {
          const label = input.id.includes("squareFootage") ? "sq ft" : "";
          display.textContent = `${input.value} ${label}`.trim();
        });

        // Initialize display on load
        const label = input.id.includes("squareFootage") ? "sq ft" : "";
        display.textContent = `${input.value} ${label}`.trim();
      }
    });
  };

  /**
   * Reset the entire form back to the first step
   */
  const resetForm = () => {
    currentStep = 1;
    showFormStep(currentStep);
    bookingForm.reset();

    // Clear step tracker summaries and reset classes
    const progressSteps = Array.from(document.querySelectorAll(".booking-step"));
    progressSteps.forEach((stepElement) => {
      stepElement.classList.remove("completed", "active", "incomplete");
      stepElement.removeAttribute("aria-current");
      stepElement.classList.remove("clickable");
      stepElement.setAttribute("aria-disabled", "true");

      const stepSummary = stepElement.querySelector(".step-summary .step-value");
      if (stepSummary) stepSummary.remove();
    });

    // Add clickable to the first step
    const firstStep = document.querySelector(`.booking-step[data-step="1"]`);
    if (firstStep) {
      firstStep.classList.add("clickable");
      firstStep.setAttribute("aria-disabled", "false");
    }

    // Update clickable steps
    updateClickableSteps(currentStep);

    // Reset main heading
    const firstStepLabel = document.querySelector(`.booking-step[data-step="1"] .booking-step-label`).textContent;
    bookingFormTitle.textContent = firstStepLabel;

    // Reset range inputs display
    initializeRangeDisplays();
  };

  return { init, resetForm };
})();
