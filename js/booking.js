// booking.js
'use strict';

/**
 * Utilities Module
 * Contains helper functions used across other modules.
 */
const Utilities = (() => {
  const isVisible = (element) => {
    while (element) {
      if (window.getComputedStyle(element).display === "none") {
        return false; // Found a hidden parent or element itself is hidden
      }
      element = element.parentElement; // Move up the DOM tree
    }
    return true; // No hidden parent found
  };
  const deepCopy = (obj) => JSON.parse(JSON.stringify(obj));
  /**
   * Sanitize HTML to prevent XSS attacks.
   * @param {string} str - The string to sanitize.
   * @returns {string} - The sanitized string.
   */
  const sanitizeHTML = (str) => {
    const temp = document.createElement("div");
    temp.textContent = str;
    return temp.innerHTML;
  };

  /**
   * Debounce function to limit the rate at which a function can fire.
   * @param {Function} func - The function to debounce.
   * @param {number} delay - The delay in milliseconds.
   * @returns {Function} - A debounced version of the input function.
   */
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const getFormattedUserId = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    return `user-${year}-${month}-${day}-${hours}:${minutes}:${seconds}`;
  };

  function toggleVisibility(showId, hideId) {
    document.getElementById(showId).style.display = "block";
    document.getElementById(hideId).style.display = "none";
  }

  return { sanitizeHTML, debounce, getFormattedUserId, toggleVisibility, deepCopy, isVisible };
})();

/**
 * Toast Module
 * Manages the display of toast notifications.
 */
const Toast = (() => {
  const toast = document.getElementById("toast");
  const toastBody = toast?.querySelector(".toast-body");

  /**
   * Show a toast notification.
   * @param {string} message - The message to display.
   * @param {boolean} isSuccess - Determines the styling of the toast.
   */
  const show = (message, isSuccess) => {
    if (!toast || !toastBody) return;

    toastBody.textContent = message;
    toast.className = "toast"; // Reset classes
    toast.classList.add(isSuccess ? "success" : "error");
    toast.hidden = false;

    // Restart CSS animation
    void toast.offsetWidth;
    toast.classList.add("show");

    // Hide after 5 seconds
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        toast.hidden = true;
      }, 500);
    }, 5000);
  };

  return { show };
})();

/**
 * Tracking Module
 * Handles sending tracking data with debouncing and retry mechanisms.
 */
const Tracking = (() => {
  const GOOGLE_SCRIPT_ID = "AKfycbwtSQA6FCXIBMyQQw4NqP-YImC8NB22VahYx1gzUOr2SqI7k_vxfMPaeMWwOYMtxu0M";
  const DEBOUNCE_DELAY = 300; // milliseconds

  const sendData = (fieldId, value) => {
    const hostname = window.location.hostname;
    const userId = localStorage.getItem("userId") || Utilities.getFormattedUserId();
    localStorage.setItem("userId", userId); // Ensure it's stored for future reference

    let sessionId = localStorage.getItem("sessionId");

    const data = { hostname, userId, sessionId, fieldId, value };

    fetch(`https://script.google.com/macros/s/${GOOGLE_SCRIPT_ID}/exec`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8" // Do not change this line
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to send data for ${fieldId}: ${response.status}`);
        }
      })
      .catch((error) => {
        console.error(`Error sending data for ${fieldId}:`, error);
      });
  };

  // Debounced version of sendData
  const sendDataDebounced = Utilities.debounce(sendData, DEBOUNCE_DELAY);

  return { sendData, sendDataDebounced };
})();


/**
 * StepTracker Class
 * Manages the step tracking UI and navigation.
 */
class StepTracker {
  constructor(totalSteps) {
    this.totalSteps = totalSteps;
    this.progressSteps = Array.from(document.querySelectorAll(".booking-step"));
  }

  /**
   * Initialize the StepTracker.
   * @param {number} initialStep - The starting step number.
   */
  init(initialStep = 1) {
    this.showFormStep(initialStep);
    this.initializeClickEvents();
    this.updateClickableSteps();
  }

  /**
   * Show the specified form step in the step tracker UI.
   * @param {number} step - The step number to show.
   */
  showFormStep(step) {
    this.progressSteps.forEach((stepElement, index) => {
      const stepNumber = index + 1;
      stepElement.classList.toggle("active", stepNumber === step);
      stepElement.classList.toggle("completed", stepNumber < step);
      stepElement.classList.toggle("incomplete", stepNumber > step);
      stepElement.setAttribute("aria-current", stepNumber === step ? "step" : "");
      stepElement.setAttribute("aria-disabled", stepNumber > step);
    });

    const bookingFormTitle = document.getElementById("bookingFormTitle");
    if (!bookingFormTitle) {
      console.warn("Element with ID 'bookingFormTitle' not found.");
      return;
    }

    const currentStepElement = this.progressSteps.find(s => {
      const stepMatch = parseInt(s.getAttribute("data-step")) === step;
      return stepMatch && window.getComputedStyle(s).display !== "none";
    });

    if (currentStepElement) {
      const stepLabel = currentStepElement.querySelector(".booking-step-label")?.textContent?.trim();
      if (stepLabel) {
        bookingFormTitle.textContent = stepLabel;
      } else {
        console.warn(`Step ${step} is missing a label.`);
      }
    }
  }

  /**
   * Initialize click events for step tracker steps.
   */
  initializeClickEvents() {
    this.progressSteps.forEach((stepElement) => {
      stepElement.addEventListener("click", () => this.handleStepClick(stepElement));
      stepElement.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.handleStepClick(stepElement);
        }
      });
    });
  }

  /**
   * Handle clicking on a step tracker step.
   * @param {HTMLElement} stepElement - The clicked step element.
   */
  handleStepClick(stepElement) {
    const step = parseInt(stepElement.getAttribute("data-step"), 10);
    if (this.canNavigateToStep(step)) {
      if (window.BookingFormInstance?.goToStep) {
        window.BookingFormInstance.goToStep(step);
      } else {
        console.warn("BookingFormInstance or goToStep method is not available. Consider implementing a fallback.");
      }
    }
  }

  /**
   * Determine if the user can navigate to a specific step.
   * - Allows navigation to any **completed** step.
   * - Allows navigation to the **next available step**.
   * - Prevents skipping ahead to unfinished steps.
   * @param {number} step - The step number.
   * @returns {boolean} - Whether navigation is allowed.
   */
  canNavigateToStep(step) {
    const highestCompleted = this.getHighestCompletedStep();
    return step <= highestCompleted || step === highestCompleted + 1;
  }

  /**
   * Get the highest completed step.
   * @returns {number} - The highest completed step number.
   */
  getHighestCompletedStep() {
    let highestCompleted = 0;
    this.progressSteps.forEach((stepElement) => {
      const stepNumber = parseInt(stepElement.getAttribute("data-step"), 10);
      if (stepElement.classList.contains("completed") && stepNumber > highestCompleted) {
        highestCompleted = stepNumber;
      }
    });
    return highestCompleted;
  }

  /**
   * Update which steps are clickable based on the highest completed step.
   */
  updateClickableSteps() {
    this.progressSteps.forEach((stepElement) => {
      const stepNumber = parseInt(stepElement.getAttribute("data-step"), 10);
      const canNavigate = this.canNavigateToStep(stepNumber);

      stepElement.classList.toggle("clickable", canNavigate);
      stepElement.setAttribute("aria-disabled", canNavigate ? "false" : "true");
    });
  }
}


/**
 * BookingForm Class
 * Handles form interactions, validation, navigation, and submission.
 */
class BookingForm {
  constructor() {

    const generateUUID = () => {
      // RFC4122 version 4 compliant UUID
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0,
          v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    };
    const sessionId = generateUUID();
    localStorage.setItem("sessionId", sessionId);

    this.bookingForm = document.getElementById("bookingForm");
    this.currentStep = 1;
    this.totalSteps = document.querySelectorAll(".booking-form-step").length;
    this.formDataStore = {};
    this.stepTracker = new StepTracker(this.totalSteps);
    this.initialize();
  }

  /**
   * Initialize the BookingForm.
   */
  initialize() {
    if (!this.bookingForm) {
      console.error("Booking form not found!");
      Toast.show("Booking form failed to load. Please try again later.", false);
      return;
    }

    this.stepTracker.init(this.currentStep);
    this.showFormStep(this.currentStep); // Ensure the first step is visible
    this.attachEventListeners();
    // Initialize sliders' background on load
    this.initializeSliderBackgrounds();
    this.initializeExtrasCountInputs();
    this.initializeRangeDisplays();
  }

  /**
 * Initialize or update slider values based on formDataStore.
 */
  initializeSliderValues() {
    const countableExtras = [
      "windows",
      "windowBlinds",
      "ceilingFans",
      "laundryFolding"
    ];

    countableExtras.forEach((extra) => {
      const slider = document.getElementById(`${extra}Slider`);
      const display = document.getElementById(`${extra}CountDisplay`);
      if (slider && display) {
        // Retrieve stored value or default to 0
        const storedValue = this.formDataStore[`${extra}Count`] || 0;
        slider.value = storedValue;
        display.textContent = `0 ${slider.getAttribute("data-units") || ""}`.trim();
        this.updateSliderBackground(slider);
      }
    });
  }


  /**
 * Update the slider's background gradient based on its current value.
 * @param {HTMLInputElement} slider - The range input element.
 */
  updateSliderBackground(slider) {
    const min = parseInt(slider.min, 10) || 0;
    const max = parseInt(slider.max, 10) || 100;
    const val = parseInt(slider.value, 10);

    const percentage = ((val - min) * 100) / (max - min);

    slider.style.backgroundImage = `linear-gradient(to right, var(--slider-fill-color) ${percentage}%, var(--slider-track-color) ${percentage}%)`;
  }

  /**
   * Initialize all sliders' backgrounds on page load.
   */
  initializeSliderBackgrounds() {
    const sliders = this.bookingForm.querySelectorAll("input[type='range']");
    sliders.forEach((slider) => {
      this.updateSliderBackground(slider);
    });
  }


  /**
   * Reset all Package selections (radio buttons) to default (unchecked).
   */
  resetPackageSelections() {
    const packageInputs = this.bookingForm.querySelectorAll(`[data-conditional-field="bookingType"][data-conditional-value="Recurring"] input[type="radio"]`);
    packageInputs.forEach((input) => {
      input.checked = false;
    });

    // Optionally, remove any active classes from package labels
    const packageLabels = this.bookingForm.querySelectorAll(`[data-conditional-field="bookingType"][data-conditional-value="Recurring"] label.booking-btn-option`);
    packageLabels.forEach((label) => {
      label.classList.remove("active");
    });
  }

  /**
   * Show the specified form step and hide others.
   * @param {number} step - The step number to display.
   */
  showFormStep(step) {
    const formSteps = this.bookingForm.querySelectorAll(".booking-form-step");
    formSteps.forEach((stepElement) => {
      const stepNumber = parseInt(stepElement.getAttribute("data-step"), 10);
      if (stepNumber === step) {
        stepElement.classList.add("booking-form-step--active");
        stepElement.setAttribute("aria-hidden", "false");
      } else {
        stepElement.classList.remove("booking-form-step--active");
        stepElement.setAttribute("aria-hidden", "true");
      }
    });

    // Update the main heading to match the current step's label
    const bookingFormTitle = document.getElementById("bookingFormTitle");
    const currentStepElement = this.stepTracker.progressSteps.find(s => parseInt(s.getAttribute("data-step")) === step);
    if (currentStepElement && bookingFormTitle) {
      const stepLabel = currentStepElement.querySelector(".booking-step-label").textContent;
      bookingFormTitle.textContent = stepLabel;
    }
  }

  /**
   * Attach necessary event listeners to the form.
   */
  attachEventListeners() {
    // Handle Next and Previous button clicks
    this.bookingForm.addEventListener("click", (e) => this.handleButtonClick(e));

    // Handle form submission
    this.bookingForm.addEventListener("submit", (e) => this.handleFormSubmit(e));

    // Handle input changes for conditional logic and radio button selections
    this.bookingForm.addEventListener("change", (e) => this.handleOptionChange(e));

    // Handle blur and input events for each input to send data to Google Script
    const inputs = Array.from(this.bookingForm.querySelectorAll("input, select, textarea"));
    inputs.forEach((input) => {
      if (input.type === "range") {
        input.addEventListener("input", Utilities.debounce((e) => this.handleSliderChange(e), 300));
      } else {
        input.addEventListener("blur", (e) => this.handleFieldBlur(e));
      }
    });

    // Handle click events on package labels to toggle active state
    const packageLabels = this.bookingForm.querySelectorAll(".package-option");
    packageLabels.forEach((label) => {
      label.addEventListener("click", () => this.togglePackageOption(label));
    });

    const extrasButtons = this.bookingForm.querySelectorAll(".extras-btn");
    extrasButtons.forEach((button) => {
      button.addEventListener("click", () => this.handleExtrasButtonClick(button));
    });
  }

  /**
   * Handle Next and Previous button clicks.
   * @param {Event} e - The click event.
   */
  handleButtonClick(e) {
    if (e.target.classList.contains("booking-btn-next")) {
      e.preventDefault();
      this.goToNextStep();
    }

    if (e.target.classList.contains("booking-btn-prev")) {
      e.preventDefault();
      this.goToPreviousStep();
    }
  }

  /**
   * Navigate to the next step after validation.
   */
  goToNextStep() {

    if (this.validateFormStep(this.currentStep)) {
      this.updateFormData(this.currentStep);
      this.currentStep++;
      this.showFormStep(this.currentStep); // Show the new step
      this.stepTracker.showFormStep(this.currentStep);
      this.stepTracker.updateClickableSteps(this.currentStep);

      // If entering Step 5, display relevant sections based on bookingType
      if (this.currentStep === 5) {
        this.displayStep5Sections();
      }
    } else {
      Toast.show("Please correct the errors on this step before proceeding.", false);
    }

  }

  /**
   * Navigate to the previous step.
   */
  goToPreviousStep() {

    this.currentStep--;
    if (this.currentStep < 1) this.currentStep = 1;
    this.showFormStep(this.currentStep); // Show the new step
    this.stepTracker.showFormStep(this.currentStep);
    this.stepTracker.updateClickableSteps(this.currentStep);

    // If re-entering Step 5, display relevant sections based on bookingType
    if (this.currentStep === 5) {
      this.displayStep5Sections();
    }
    this.initializeExtrasCountInputs();

  }

  /**
   * Navigate directly to a specific step.
   * @param {number} step - The step number to navigate to.
   */
  goToStep(step) {
    if (step < 1 || step > this.totalSteps) return;
    this.currentStep = step;
    this.showFormStep(this.currentStep); // Show the new step
    this.stepTracker.showFormStep(this.currentStep);
    this.stepTracker.updateClickableSteps(this.currentStep);

    // If entering Step 5, display relevant sections based on bookingType
    if (this.currentStep === 5) {
      this.displayStep5Sections();
    }
  }

  /**
   * Handle form submission.
   * @param {Event} e - The submit event.
   */
  handleFormSubmit(e) {
    e.preventDefault();
    if (this.validateFormStep(this.currentStep)) {

      // Update step tracker with final step's data
      this.updateFormData(this.currentStep);
      // Add loading state
      const submitButton = document.querySelector(".booking-btn-submit");
      submitButton.classList.add("loading");
      submitButton.innerHTML = `<div class="spinner"></div> Submitting...`;
      Tracking.sendData('submitClicked', "Submitted");
      console.log("Form Data:", this.formDataStore);
      // this.resetForm(); // REMOVE this line when the code below is uncommented
      // Toast.show("Your request has been submitted successfully. We will contact you shortly.", true);

      // Send data via EmailJS or your preferred email service
      Email.sendBookingRequest(this.formDataStore)
        .then(() => {
          Toast.show("Your request has been submitted successfully. We will contact you shortly.", true);
          this.resetForm();
          // Redirect to thank you page after a short delay
          setTimeout(() => {
            submitButton.classList.remove("loading");
            submitButton.innerHTML = "Request Quote";
            window.location.href = "/thankyou.html";
          }, 1000);
        })
        .catch((error) => {
          Toast.show("Failed to submit your request. Please try again later.", false);
          console.error("EmailJS Error:", error);
        });
    } else {
      Toast.show("Please correct the errors on this step before submitting.", false);
    }
  }

  /**
   * Handle option changes for radio buttons and checkboxes.
   * @param {Event} e - The change event.
   */
  handleOptionChange(e) {
    const target = e.target;

    if (target.type === "radio") {
      const name = target.name;
      const value = target.value;

      // Set the value in the formDataStore
      this.formDataStore[name] = value;

      // Handle conditional display based on selection
      this.handleConditionalDisplay(name, value);
    }

    if (target.type === "checkbox") {
      this.handleCheckboxChange(target);
    }
  }

  /**
   * Handle checkbox changes for conditional fields.
   * @param {HTMLElement} checkbox - The changed checkbox element.
   */
  handleCheckboxChange(checkbox) {
    const fieldName = checkbox.name;
    // Check if this.formDataStore[fieldName] is a string, then convert to array using commas as delimiters
    if (typeof this.formDataStore[fieldName] === 'string') {
      this.formDataStore[fieldName] = this.formDataStore[fieldName].split(', ').map(item => item.trim());
    }
    if (!this.formDataStore[fieldName]) {
      this.formDataStore[fieldName] = [];
    }

    if (checkbox.checked) {
      if (!this.formDataStore[fieldName].includes(checkbox.value)) {
        this.formDataStore[fieldName].push(checkbox.value);
      }
    } else {
      if (this.formDataStore[fieldName]) {
        this.formDataStore[fieldName] = this.formDataStore[fieldName].filter((item) => item !== checkbox.value);
      }
    }
  }


  /**
   * Handle conditional display of fields based on selection.
   * @param {string} fieldName - The name of the field.
   * @param {string|null} value - The selected value.
   */
  handleConditionalDisplay(fieldName, value) {
    const conditionalFields = this.bookingForm.querySelectorAll(`[data-conditional-field="${fieldName}"]`);
    conditionalFields.forEach((fieldWrapper) => {
      const conditionalValue = fieldWrapper.getAttribute("data-conditional-value").trim().toLowerCase();
      const selectedValue = value ? value.trim().toLowerCase() : "";

      if (selectedValue === conditionalValue) {
        fieldWrapper.style.display = "block";
        fieldWrapper.setAttribute("aria-hidden", "false");
        // Add 'required' attribute to inputs within the now-visible field group, except for 'extras'
        const inputs = fieldWrapper.querySelectorAll("input, select, textarea");
        inputs.forEach((input) => {
          if (fieldName === "extras") {
            input.removeAttribute("required");
          } else if (input.dataset.required === "true") {
            input.setAttribute("required", "required");
          }
        });
      } else {
        fieldWrapper.style.display = "none";
        fieldWrapper.setAttribute("aria-hidden", "true");

        // Clear the value if hiding, including range inputs
        const inputs = fieldWrapper.querySelectorAll("input, select, textarea");
        inputs.forEach((input) => {
          if (input.type === "radio" || input.type === "checkbox") {
            input.checked = false;
          } else if (input.type === "range") {
            input.value = 0; // Reset sliders to 0
            // Update the corresponding display span
            const displaySpan = this.bookingForm.querySelector(`#${input.id}Value`);
            if (displaySpan) {
              displaySpan.textContent = `0 ${input.getAttribute("data-units") || ""}`.trim();
            }
            // Update the slider's background
            this.updateSliderBackground(input);
          } else {
            input.value = "";
          }
          // Remove 'required' attribute from inputs within the now-hidden field group
          input.removeAttribute("required");
        });
      }
    });

    // If bookingType changes, update Step 5 sections accordingly
    if (fieldName === "bookingType") {
      this.displayStep5Sections();
    }
  }

  /**
   * Handle slider input changes.
   * @param {Event} e - The input event.
   */
  handleSliderChange(e) {
    const fieldId = e.target.id.replace("booking-", "");
    const value = e.target.value.trim();
    // Tracking.sendDataDebounced(fieldId, value);
  }

  /**
   * Handle field blur event to send data to Google Script.
   * @param {Event} e - The blur event.
   */
  handleFieldBlur(e) {
    const fieldId = e.target.id.replace("booking-", "");
    const value = e.target.value.trim();
    Tracking.sendData(fieldId, value);
  }

  /**
   * Validate all input fields in the current step.
   * @param {number} step - The current step number.
   * @returns {boolean} - Whether the current step is valid.
   */
  validateFormStep(step) {
    const currentFormStep = this.bookingForm.querySelector(`.booking-form-step[data-step="${step}"]`);
    if (!currentFormStep) return true;

    const inputs = Array.from(currentFormStep.querySelectorAll("input, select, textarea"));
    let isValid = true;

    inputs.forEach((input) => {
      // Check if the input's parent .booking-form-group is visible
      const fieldGroup = input.closest(".booking-form-group");
      const isVisible = fieldGroup && fieldGroup.offsetParent !== null;

      if (!isVisible) return; // Skip hidden fields

      if (!input.checkValidity()) {
        isValid = false;
        input.classList.add("border-red-500");

        // Show error message if present
        const errorMessage = input.parentElement.querySelector(".error-message");
        if (errorMessage) {
          errorMessage.style.display = "block";
          errorMessage.textContent = input.validationMessage || "This field is required.";
        }

        input.reportValidity();
      } else {
        input.classList.remove("border-red-500");

        // Hide error message if present
        const errorMessage = input.parentElement.querySelector(".error-message");
        if (errorMessage) {
          errorMessage.style.display = "none";
        }
      }
    });

    if (!isValid) {
      Toast.show("Please correct the errors on this step before proceeding.", false);
    }

    return isValid;
  }

  /**
   * Update the form data store with data from the completed step.
   * @param {number} step - The completed step number.
   */
  updateFormData(step) {

    const currentFormStep = this.bookingForm.querySelector(`.booking-form-step[data-step="${step}"]`);
    if (!currentFormStep) return;

    const fields = Array.from(currentFormStep.querySelectorAll("[name]")).filter(Utilities.isVisible);
    const data = {};

    fields.forEach((field) => {
      if (field.type === "radio") {
        if (field.checked) {
          data[field.name] = field.value;
        }
      } else if (field.type === "checkbox") {
        if (!data[field.name]) data[field.name] = [];
        if (field.checked) data[field.name].push(field.value);
      } else {
        data[field.name] = field.value;
      }
    });

    const extras = Utilities.deepCopy(this.formDataStore);
    // console.log("updateFormData", Utilities.deepCopy(data));

    // Merge step data into the store
    this.formDataStore = { ...this.formDataStore, ...data };
    this.formDataStore.extras = extras.extras;
    data.extras = extras.extras;

    // Handle Step 5 Extras
    if (step === 5 && this.formDataStore.bookingType === "One-Time") {
      this.compileExtras();
      data.extras = this.formDataStore.extras.join(", ");
    }

    // Append step data to the tracker
    this.appendStepData(step, data);

    // Send tracking data
    this.sendTrackingData(data);
  }

  /**
   * Append summarized data to the step tracker.
   * @param {number} step - The step number.
   * @param {object} data - The data from the step.
   */
  appendStepData(step, data) {

    let stepElement = document.querySelectorAll(`.booking-step[data-step="${step}"]`);
    stepElement = Array.from(stepElement).find(Utilities.isVisible);

    if (!stepElement) return;

    let fieldValue = "";

    switch (step) {
      case 1:
        fieldValue = `
          <div class="step-value">
            <strong>Full Name:</strong> ${Utilities.sanitizeHTML(data.name || "N/A")}<br>
            <strong>Email:</strong> ${Utilities.sanitizeHTML(data.email || "N/A")}<br>
            <strong>Phone:</strong> ${Utilities.sanitizeHTML(data.phone || "N/A")}
          </div>
        `;
        break;
      case 2:
        fieldValue = `
          <div class="step-value">
            <strong>Industry:</strong> ${Utilities.sanitizeHTML(data.industry || "N/A")}
          </div>
        `;
        break;
      case 3:
        if (data.bookingType === "Recurring") {
          fieldValue = `
            <div class="step-value">
              <strong>Booking Type:</strong> Recurring<br>
              <strong>Frequency:</strong> ${Utilities.sanitizeHTML(data.frequency || "N/A")}
            </div>
          `;
        } else {
          fieldValue = `
            <div class="step-value">
              <strong>Booking Type:</strong> One-Time<br>
              <strong>Service Type:</strong> ${Utilities.sanitizeHTML(data.serviceType || "N/A")}
            </div>
          `;
        }
        break;
      case 4:
        fieldValue = `
          <div class="step-value">
            <strong>Square Footage:</strong> ${Utilities.sanitizeHTML(data.squareFootage || "N/A")} sq ft<br>
            <strong>Bedrooms:</strong> ${Utilities.sanitizeHTML(data.bedrooms || "N/A")}<br>
            <strong>Bathrooms:</strong> ${Utilities.sanitizeHTML(data.bathrooms || "N/A")}<br>
            <strong>Powder Rooms:</strong> ${Utilities.sanitizeHTML(data.powderRooms || "N/A")}
          </div>
        `;
        break;
      case 5:
        if (this.formDataStore.bookingType === "One-Time") {
          const extrasDisplay = this.formDataStore.extras || "None";
          fieldValue = `
            <div class="step-value">
              <strong>Extras:</strong> ${Utilities.sanitizeHTML(extrasDisplay !== "None" ? extrasDisplay.join(", ") : '' || "None")}
            </div>
          `;
        } else {
          fieldValue = `
            <div class="step-value">
              <strong>Package:</strong> ${Utilities.sanitizeHTML(data.package || "N/A")} Hours
            </div>
          `;
        }
        break;
      case 6:
        fieldValue = `
          <div class="step-value">
            <strong>Address:</strong> ${Utilities.sanitizeHTML(data.address || "N/A")}<br>
            <strong>Preferred Date:</strong> ${Utilities.sanitizeHTML(data.date || "N/A")}<br>
            <strong>Additional Details:</strong> ${Utilities.sanitizeHTML(data.details || "N/A")}
          </div>
        `;
        break;
      default:
        break;
    }

    // Remove existing summary if any
    const existingStepValue = stepElement.querySelector(".step-summary .step-value");
    if (existingStepValue) existingStepValue.remove();

    stepElement.querySelector(".step-summary").insertAdjacentHTML("beforeend", fieldValue);
  }

  /**
   * Send tracking data for each field.
   * @param {object} data - The data object containing field-value pairs.
   */
  sendTrackingData(data) {
    Object.entries(data).forEach(([fieldId, value]) => {
      if (Array.isArray(value)) {
        value.forEach((val) => Tracking.sendData(fieldId, val));
      } else {
        Tracking.sendData(fieldId, value);
      }
    });
  }

  /**
   * Toggle the active state of a package option.
   * @param {HTMLElement} label - The clicked package label.
   */
  togglePackageOption(label) {
    const packageLabels = this.bookingForm.querySelectorAll(".package-option");
    packageLabels.forEach((lbl) => lbl.classList.remove("active"));
    label.classList.add("active");
  }

  /**
   * Display Step 5 sections based on bookingType.
   */
  /**
   * Display Step 5 sections based on bookingType.
   */
  displayStep5Sections() {
    const bookingType = this.formDataStore.bookingType;
    const step5 = this.bookingForm.querySelector('.booking-form-step[data-step="5"]');
    if (!step5) return;

    const extrasGroup = step5.querySelector(`[data-conditional-field="bookingType"][data-conditional-value="One-Time"]`);
    const packageGroup = step5.querySelector(`[data-conditional-field="bookingType"][data-conditional-value="Recurring"]`);

    if (bookingType === "Recurring") {
      Utilities.toggleVisibility("selectPackage", "selectExtras");

      if (extrasGroup) {
        extrasGroup.style.display = "none";
        extrasGroup.setAttribute("aria-hidden", "true");
        // Remove 'required' from extras inputs if any
        const extrasInputs = extrasGroup.querySelectorAll("input, select, textarea");
        extrasInputs.forEach((input) => {
          if (input.name === "extras") {
            input.removeAttribute("required");
          } else if (input.dataset.required === "true") {
            input.setAttribute("required", "required");
          }
        });

        // **Reset Extras Sliders to 0**
        this.resetExtrasSliders();
      }
      if (packageGroup) {
        packageGroup.style.display = "block";
        packageGroup.setAttribute("aria-hidden", "false");
        // Add 'required' to package inputs if necessary
        const packageInputs = packageGroup.querySelectorAll("input, select, textarea");
        packageInputs.forEach((input) => {
          if (input.dataset.required === "true" || input.getAttribute("required") === null) {
            input.setAttribute("required", "required");
          }
        });
      }
    } else if (bookingType === "One-Time") {
      Utilities.toggleVisibility("selectExtras", "selectPackage");
      if (packageGroup) {
        packageGroup.style.display = "none";
        packageGroup.setAttribute("aria-hidden", "true");
        // Remove 'required' from package inputs if any
        const packageInputs = packageGroup.querySelectorAll("input, select, textarea");
        packageInputs.forEach((input) => input.removeAttribute("required"));

        // **Reset Package Selections**
        this.resetPackageSelections();
      }
      if (extrasGroup) {
        extrasGroup.style.display = "block";
        extrasGroup.setAttribute("aria-hidden", "false");
        // Add 'required' to extras inputs if necessary
        const extrasInputs = extrasGroup.querySelectorAll("input, select, textarea");
        extrasInputs.forEach((input) => {
          // Ensure Extras are not required
          if (input.name !== "extras") { // Extra precaution
            input.removeAttribute("required");
          }
        });
        // **Initialize slider values based on formDataStore**
        this.initializeSliderValues();
      }
    } else {
      if (extrasGroup) {
        extrasGroup.style.display = "none";
        extrasGroup.setAttribute("aria-hidden", "true");
        const extrasInputs = extrasGroup.querySelectorAll("input, select, textarea");
        extrasInputs.forEach((input) => input.removeAttribute("required"));

        // **Reset Extras Sliders to 0**
        this.resetExtrasSliders();
      }
      if (packageGroup) {
        packageGroup.style.display = "none";
        packageGroup.setAttribute("aria-hidden", "true");
        const packageInputs = packageGroup.querySelectorAll("input, select, textarea");
        packageInputs.forEach((input) => input.removeAttribute("required"));

        // **Reset Package Selections**
        this.resetPackageSelections();
      }
    }
  }

  /**
  * Initialize range input displays and backgrounds.
  */
  initializeRangeDisplays() {
    const rangeInputs = Array.from(this.bookingForm.querySelectorAll("input[type='range']"));
    rangeInputs.forEach((input) => {
      const display = this.bookingForm.querySelector(`#${input.id}Value`);
      if (display) {
        const label = input.getAttribute("data-units") || "";

        // Set initial display
        display.textContent = `${input.value} ${label}`.trim();

        // Initialize slider background
        this.updateSliderBackground(input);

        // Add input event listener to update display and background dynamically
        input.addEventListener("input", () => {
          display.textContent = `${input.value} ${label}`.trim();
          this.updateSliderBackground(input);
        });
      }
    });
  }


  /**
   * Show the toast notification.
   * @param {string} message - The message to display.
   * @param {boolean} isSuccess - Determines the styling of the toast.
   */
  showToast(message, isSuccess) {
    Toast.show(message, isSuccess);
  }

  /**
   * Reset the entire form to its initial state.
   */
  resetForm() {
    this.currentStep = 1;
    this.showFormStep(this.currentStep); // Show the first step
    this.stepTracker.showFormStep(this.currentStep);
    this.stepTracker.updateClickableSteps(this.currentStep);
    this.bookingForm.reset();

    // Hide conditional fields
    const conditionalFields = this.bookingForm.querySelectorAll("[data-conditional-field]");
    conditionalFields.forEach((fieldWrapper) => {
      fieldWrapper.style.display = "none";
      fieldWrapper.setAttribute("aria-hidden", "true");
      // Clear the value if hiding
      const inputs = fieldWrapper.querySelectorAll("input, select, textarea");
      inputs.forEach((input) => {
        if (input.type === "radio" || input.type === "checkbox") {
          input.checked = false;
        } else {
          input.value = "";
        }
        // Remove 'required' attribute from hidden fields
        input.removeAttribute("required");
      });
    });

    // Remove dynamically added count inputs
    // this.removeExtrasCountInputs();

    // Remove active class from option buttons
    const optionButtons = this.bookingForm.querySelectorAll(".booking-btn-option");
    optionButtons.forEach((btn) => {
      btn.classList.remove("active");
      btn.setAttribute("aria-pressed", "false");
    });

    // Clear formDataStore
    this.formDataStore = {};

    // Clear step tracker summaries and reset classes
    const progressSteps = Array.from(document.querySelectorAll(".booking-step"));
    progressSteps.forEach((stepElement) => {
      stepElement.classList.remove("completed", "active");
      stepElement.removeAttribute("aria-current");
      stepElement.classList.remove("clickable");
      stepElement.setAttribute("aria-disabled", "true");

      const stepSummary = stepElement.querySelector(".step-summary .step-value");
      if (stepSummary) stepSummary.remove();
    });

    // Make the first step clickable again
    const firstStep = document.querySelector(`.booking-step[data-step="1"]`);
    if (firstStep) {
      firstStep.classList.add("clickable");
      firstStep.setAttribute("aria-disabled", "false");
      firstStep.classList.add("active");
      firstStep.setAttribute("aria-current", "step");
    }

    this.stepTracker.updateClickableSteps(this.currentStep);

    // Reset heading
    const firstStepLabel = document.querySelector(`.booking-step[data-step="1"] .booking-step-label`).textContent;
    const bookingFormTitle = document.getElementById("bookingFormTitle");
    if (bookingFormTitle) bookingFormTitle.textContent = firstStepLabel;

    // Re-initialize range displays
    this.initializeRangeDisplays();
  }

  /**
   * Sanitize HTML to prevent XSS.
   * @param {string} str - The string to sanitize.
   * @returns {string} - The sanitized string.
   */
  sanitizeHTML(str) {
    return Utilities.sanitizeHTML(str);
  }

  /**
   * Convert camelCase to Readable Text.
   * @param {string} text - The camelCase text.
   * @returns {string} - The readable text.
   */
  convertCamelCaseToReadable(text) {
    const result = text.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
  }












  handleExtrasButtonClick(button) {
    const value = button.getAttribute("data-value");
    const isPressed = button.getAttribute("aria-pressed") === "true";

    if (isPressed) {
      // Deselect the button
      button.setAttribute("aria-pressed", "false");
      button.classList.remove("active"); // Optional: if you have additional styles
      // Remove the value from formDataStore.extras
      if (Array.isArray(this.formDataStore.extras)) {
        this.formDataStore.extras = this.formDataStore.extras.filter(item => item !== value);
      }
    } else {
      // Select the button
      button.setAttribute("aria-pressed", "true");
      button.classList.add("active"); // Optional: if you have additional styles
      // Add the value to formDataStore.extras
      if (!Array.isArray(this.formDataStore.extras)) {
        this.formDataStore.extras = [];
      }
      this.formDataStore.extras.push(value);
    }

    // Update the step summary
    this.appendStepData(this.currentStep, { extras: this.formDataStore.extras });

    // Optional: Send tracking data
    Tracking.sendData('extras', this.formDataStore.extras.join(', '));
  }

  resetExtrasSliders() {
    const countableExtras = [
      "windows",
      "windowBlinds",
      "ceilingFans",
      "laundryFolding"
    ];

    countableExtras.forEach((extra) => {
      const slider = document.getElementById(`${extra}Slider`);
      const display = document.getElementById(`${extra}CountDisplay`);
      if (slider && display) {
        slider.value = 0;
        display.textContent = `0 ${slider.getAttribute("data-units") || ""}`.trim();
        this.formDataStore[`${extra}Count`] = 0;
        this.updateSliderBackground(slider);
      }
    });
  }

  compileExtras() {
    // Ensure extras is always an array and clean any prior countable extras
    this.formDataStore.extras = Array.isArray(this.formDataStore.extras)
      ? this.formDataStore.extras.filter(extra => !extra.match(/\(\d+\)$/)) // Remove prior countable extras
      : typeof this.formDataStore.extras === "string"
        ? this.formDataStore.extras.split(", ").map(item => item.trim()).filter(extra => !extra.match(/\(\d+\)$/))
        : [];

    const countableExtras = ["windows", "windowBlinds", "ceilingFans", "laundryFolding"];

    countableExtras.forEach((extra) => {
      const count = this.formDataStore[`${extra}Count`];
      if (count && parseInt(count) > 0) {
        const displayName = this.convertCamelCaseToReadable(extra);
        this.formDataStore.extras.push(`${displayName} (${count})`);
      }
    });

    // Ensure extras remains an array
    if (!Array.isArray(this.formDataStore.extras)) {
      this.formDataStore.extras = [];
    }
  }

  removeExtrasCountInputs() {
    const countInputs = this.bookingForm.querySelectorAll("input[type='range'][name$='Count']");
    countInputs.forEach((input) => input.parentElement.remove());
  }

  initializeExtrasCountInputs() {
    // Define countable extras with their respective IDs
    const countableExtras = [
      { name: "windows", displayName: "Windows" },
      { name: "windowBlinds", displayName: "Window Blinds" },
      { name: "ceilingFans", displayName: "Ceiling Fans" },
      { name: "laundryFolding", displayName: "Laundry & Folding (Loads)" },
    ];

    countableExtras.forEach((extra) => {
      const sliderContainer = document.getElementById(`${extra.name}SliderContainer`);
      const slider = document.getElementById(`${extra.name}Slider`);
      const countDisplay = document.getElementById(`${extra.name}CountDisplay`);

      if (sliderContainer && slider && countDisplay) {
        // ✅ Ensure sliders are always visible
        sliderContainer.style.display = "flex";

        // ✅ Initialize the count display with the slider's default value
        countDisplay.textContent = slider.value;

        // ✅ Initialize the slider's background
        this.updateSliderBackground(slider);

        // ✅ Store the initial value in `formDataStore`
        this.formDataStore[`${extra.name}Count`] = parseInt(slider.value, 10);

        // ✅ Event listener for slider input (updates UI and formDataStore)
        slider.addEventListener("input", () => {
          countDisplay.textContent = slider.value; // Update the UI
          this.formDataStore[`${extra.name}Count`] = parseInt(slider.value, 10); // Store new value
          this.appendStepData(this.currentStep, this.formDataStore);
          this.updateSliderBackground(slider); // Update background
        });
      } else {
        console.warn(`Missing elements for: ${extra.name}`);
      }
    });
  }

}

/**
 * Initialize the BookingForm once the DOM is loaded.
 */
document.addEventListener("DOMContentLoaded", () => {
  window.BookingFormInstance = new BookingForm();
});
