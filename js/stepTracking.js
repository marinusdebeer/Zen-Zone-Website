// stepTracking.js

/**
 * StepTracker Module
 * Manages the step tracking UI, navigation, and related functionalities.
 */
const StepTracker = (() => {
  /**
   * Initialize the StepTracker module
   * @param {number} initialStep - The starting step number.
   */
  const init = (initialStep = 1) => {
    showFormStep(initialStep);
    initializeStepTrackerClick();
    updateClickableSteps(initialStep);
  };

  /**
   * Show the specified form step
   * @param {number} step 
   */
  const showFormStep = (step) => {
    const formSteps = Array.from(document.querySelectorAll(".booking-form-step"));
    formSteps.forEach((formStep, index) => {
      formStep.classList.toggle("booking-form-step--active", index + 1 === step);
      formStep.setAttribute("aria-hidden", index + 1 !== step);
    });

    // Update main heading
    const bookingFormTitle = document.getElementById("bookingFormTitle");
    const currentStepElement = document.querySelector(`.booking-step[data-step="${step}"]`);
    if (currentStepElement && bookingFormTitle) {
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
   * Initialize click events for step tracker steps
   */
  const initializeStepTrackerClick = () => {
    const progressSteps = Array.from(document.querySelectorAll(".booking-step"));
    progressSteps.forEach((stepElement) => {
      stepElement.addEventListener("click", () => {
        const step = parseInt(stepElement.getAttribute("data-step"), 10);
        if (canNavigateToStep(step)) {
          showFormStep(step);
          // Update current step in BookingForm if necessary
          BookingForm.setCurrentStep(step);
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
   * Update which steps are clickable based on the highest completed step
   * @param {number} step 
   */
  const updateClickableSteps = (step) => {
    const progressSteps = Array.from(document.querySelectorAll(".booking-step"));
    progressSteps.forEach((stepElement) => {
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
   * Expose public methods
   */
  return {
    init,
    showFormStep,
    updateClickableSteps,
    getHighestCompletedStep,
    canNavigateToStep,
  };
})();
