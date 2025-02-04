'use strict';

const Utilities = (() => {
  const isVisible = el => {
    while (el) {
      if (getComputedStyle(el).display === 'none') return false;
      el = el.parentElement;
    }
    return true;
  };

  const deepCopy = obj => JSON.parse(JSON.stringify(obj));

  const sanitizeHTML = str => {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
  };

  const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  };

  const getFormattedUserId = () => {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `user-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  };

  const toggleVisibility = (showId, hideId) => {
    const showEl = document.getElementById(showId);
    const hideEl = document.getElementById(hideId);
    if (showEl) showEl.style.display = 'block';
    if (hideEl) hideEl.style.display = 'none';
  };

  return { isVisible, deepCopy, sanitizeHTML, debounce, getFormattedUserId, toggleVisibility };
})();

const Toast = (() => {
  const toast = document.getElementById('toast');
  const toastBody = toast?.querySelector('.toast-body');

  const show = (msg, success) => {
    if (!toast || !toastBody) return;
    toastBody.textContent = msg;
    toast.className = 'toast';
    toast.classList.add(success ? 'success' : 'error');
    toast.hidden = false;
    void toast.offsetWidth;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => (toast.hidden = true), 500);
    }, 5000);
  };

  return { show };
})();

const Tracking = (() => {
  const GOOGLE_SCRIPT_ID = 'AKfycbwtSQA6FCXIBMyQQw4NqP-YImC8NB22VahYx1gzUOr2SqI7k_vxfMPaeMWwOYMtxu0M';

  const sendData = (fieldId, value) => {
    const hostname = location.hostname;
    const userId = localStorage.getItem('userId') || Utilities.getFormattedUserId();
    localStorage.setItem('userId', userId);
    const sessionId = localStorage.getItem('sessionId');
    const data = { hostname, userId, sessionId, fieldId, value };

    if (['name', 'email', 'phone'].includes(fieldId)) {
      posthog?.people?.set({ [fieldId]: value });
    }

    fetch(`https://script.google.com/macros/s/${GOOGLE_SCRIPT_ID}/exec`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data)
    }).catch(err => console.error(`Error sending data for ${fieldId}:`, err));
  };

  const sendDataDebounced = Utilities.debounce(sendData, 300);
  return { sendData, sendDataDebounced };
})();

class StepTracker {
  constructor(totalSteps) {
    this.totalSteps = totalSteps;
    this.progressSteps = Array.from(document.querySelectorAll('.booking-step'));
  }

  init(step = 1) {
    this.showFormStep(step);
    this.progressSteps.forEach(s => {
      s.addEventListener('click', () => this.handleStepClick(s));
      s.addEventListener('keydown', e => {
        if (['Enter', ' '].includes(e.key)) {
          e.preventDefault();
          this.handleStepClick(s);
        }
      });
    });
    this.updateClickableSteps();
  }

  showFormStep(step) {
    this.progressSteps.forEach((s, i) => {
      const sn = i + 1;
      s.classList.toggle('active', sn === step);
      s.classList.toggle('completed', sn < step);
      s.classList.toggle('incomplete', sn > step);
      s.setAttribute('aria-current', sn === step ? 'step' : '');
      s.setAttribute('aria-disabled', sn > step);
    });
    const title = document.getElementById('bookingFormTitle');
    const cur = this.progressSteps.find(
      s => parseInt(s.getAttribute('data-step'), 10) === step &&
        getComputedStyle(s).display !== 'none'
    );
    if (cur && title) {
      const label = cur.querySelector('.booking-step-label')?.textContent?.trim();
      if (label) title.textContent = label;
    }
  }

  handleStepClick(s) {
    const step = parseInt(s.getAttribute('data-step'), 10);
    if (this.canNavigateToStep(step) && window.BookingFormInstance?.goToStep) {
      window.BookingFormInstance.goToStep(step);
    }
  }

  canNavigateToStep(step) {
    return step <= this.getHighestCompletedStep() || step === this.getHighestCompletedStep() + 1;
  }

  getHighestCompletedStep() {
    let highest = 0;
    this.progressSteps.forEach(s => {
      const sn = parseInt(s.getAttribute('data-step'), 10);
      if (s.classList.contains('completed') && sn > highest) highest = sn;
    });
    return highest;
  }

  updateClickableSteps() {
    this.progressSteps.forEach(s => {
      const sn = parseInt(s.getAttribute('data-step'), 10);
      const can = this.canNavigateToStep(sn);
      s.classList.toggle('clickable', can);
      s.setAttribute('aria-disabled', can ? 'false' : 'true');
    });
  }
}

class BookingForm {
  constructor() {
    this._generateSessionId();
    this.bookingForm = document.getElementById('bookingForm');
    this.currentStep = 1;
    this.totalSteps = document.querySelectorAll('.booking-form-step').length;
    this.formDataStore = {};
    this.stepTracker = new StepTracker(this.totalSteps);
    this.init();
  }

  _generateSessionId() {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c =>
      ((Math.random() * 16) | 0).toString(16)
    );
    localStorage.setItem('sessionId', uuid);
  }

  init() {
    if (!this.bookingForm) {
      console.error('Booking form not found!');
      Toast.show('Booking form failed to load. Please try again later.', false);
      return;
    }
    this.stepTracker.init(this.currentStep);
    this.showFormStep(this.currentStep);
    this.attachListeners();
    this.initializeSliderBackgrounds();
    this.initializeExtrasCountInputs();
    this.initializeRangeDisplays();
  }

  updateSliderBackground(slider) {
    const min = +slider.min || 0,
      max = +slider.max || 100,
      val = +slider.value;
    const pct = ((val - min) * 100) / (max - min);
    slider.style.backgroundImage = `linear-gradient(to right, var(--slider-fill-color) ${pct}%, var(--slider-track-color) ${pct}%)`;
  }

  initializeSliderBackgrounds() {
    this.bookingForm.querySelectorAll("input[type='range']").forEach(slider =>
      this.updateSliderBackground(slider)
    );
  }

  showFormStep(step) {
    this.bookingForm.querySelectorAll('.booking-form-step').forEach(el => {
      const sn = parseInt(el.getAttribute('data-step'), 10);
      el.classList.toggle('booking-form-step--active', sn === step);
      el.setAttribute('aria-hidden', sn === step ? 'false' : 'true');
    });
    const title = document.getElementById('bookingFormTitle');
    const cur = this.stepTracker.progressSteps.find(
      s => parseInt(s.getAttribute('data-step'), 10) === step
    );
    if (cur && title) {
      title.textContent = cur.querySelector('.booking-step-label').textContent;
    }
  }

  attachListeners() {
    this.bookingForm.addEventListener('click', e => this.handleButtonClick(e));
    this.bookingForm.addEventListener('submit', e => this.handleFormSubmit(e));
    this.bookingForm.addEventListener('change', e => this.handleOptionChange(e));
    Array.from(this.bookingForm.querySelectorAll('input, select, textarea')).forEach(input => {
      if (input.type === 'range') {
        input.addEventListener('input', Utilities.debounce(e => this.handleSliderChange(e), 300));
      } else {
        input.addEventListener('blur', e => this.handleFieldBlur(e));
      }
    });
    this.bookingForm.querySelectorAll('.package-option').forEach(lbl =>
      lbl.addEventListener('click', () => this.togglePackageOption(lbl))
    );
    this.bookingForm.querySelectorAll('.extras-btn').forEach(btn =>
      btn.addEventListener('click', () => this.handleExtrasButtonClick(btn))
    );
    this.bookingForm.addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.target.tagName.toLowerCase() !== 'textarea') e.preventDefault();
    });
  }

  handleButtonClick(e) {
    if (e.target.classList.contains('booking-btn-next')) {
      e.preventDefault();
      this.goToNextStep();
    }
    if (e.target.classList.contains('booking-btn-prev')) {
      e.preventDefault();
      this.goToPreviousStep();
    }
  }

  goToNextStep() {
    if (this.validateFormStep(this.currentStep)) {
      this.updateFormData(this.currentStep);
      this.currentStep++;
      this.showFormStep(this.currentStep);
      this.stepTracker.showFormStep(this.currentStep);
      this.stepTracker.updateClickableSteps();
      if (this.currentStep === 5) this.displayStep5Sections();
    } else {
      Toast.show('Please correct the errors on this step before proceeding.', false);
    }
  }

  goToPreviousStep() {
    this.currentStep = Math.max(1, this.currentStep - 1);
    this.showFormStep(this.currentStep);
    this.stepTracker.showFormStep(this.currentStep);
    this.stepTracker.updateClickableSteps();
    if (this.currentStep === 5) this.displayStep5Sections();
    this.initializeExtrasCountInputs();
  }

  goToStep(step) {
    if (step < 1 || step > this.totalSteps) return;
    this.currentStep = step;
    this.showFormStep(this.currentStep);
    this.stepTracker.showFormStep(this.currentStep);
    this.stepTracker.updateClickableSteps();
    if (this.currentStep === 5) this.displayStep5Sections();
  }

  handleFormSubmit(e) {
    e.preventDefault();
    if (this.validateFormStep(this.currentStep)) {
      this.updateFormData(this.currentStep);
      const submitBtn = document.querySelector('.booking-btn-submit');
      submitBtn.classList.add('loading');
      submitBtn.innerHTML = `<div class="spinner"></div> Submitting...`;
      Tracking.sendData('submitClicked', 'Submitted');
      Email.sendBookingRequest(this.formDataStore)
        .then(() => {
          Toast.show('Your request has been submitted successfully. We will contact you shortly.', true);
          this.resetForm();
          setTimeout(() => {
            submitBtn.classList.remove('loading');
            submitBtn.innerHTML = 'Request Quote';
            window.location.href = '/thankyou.html';
          }, 1000);
        })
        .catch(err => {
          Toast.show('Failed to submit your request. Please try again later.', false);
          console.error('EmailJS Error:', err);
        });
    } else {
      Toast.show('Please correct the errors on this step before submitting.', false);
    }
  }

  handleOptionChange(e) {
    const tgt = e.target;
    if (tgt.type === 'radio') {
      this.formDataStore[tgt.name] = tgt.value;
      this.handleConditionalDisplay(tgt.name, tgt.value);
    }
    if (tgt.type === 'checkbox') {
      this.handleCheckboxChange(tgt);
    }
  }

  handleCheckboxChange(cb) {
    const name = cb.name;
    this.formDataStore[name] = this.formDataStore[name] || [];
    if (cb.checked) {
      if (!this.formDataStore[name].includes(cb.value))
        this.formDataStore[name].push(cb.value);
    } else {
      this.formDataStore[name] = this.formDataStore[name].filter(item => item !== cb.value);
    }
  }

  handleConditionalDisplay(field, value) {
    const fields = this.bookingForm.querySelectorAll(`[data-conditional-field="${field}"]`);
    fields.forEach(wrapper => {
      const cond = wrapper.getAttribute('data-conditional-value').trim().toLowerCase();
      if ((value || '').trim().toLowerCase() === cond) {
        wrapper.style.display = 'block';
        wrapper.setAttribute('aria-hidden', 'false');
        wrapper.querySelectorAll('input, select, textarea').forEach(input => {
          if (field === 'extras') input.removeAttribute('required');
          else if (input.dataset.required === 'true') input.setAttribute('required', 'required');
        });
      } else {
        wrapper.style.display = 'none';
        wrapper.setAttribute('aria-hidden', 'true');
        wrapper.querySelectorAll('input, select, textarea').forEach(input => {
          if (['radio', 'checkbox'].includes(input.type)) input.checked = false;
          else if (input.type === 'range') {
            input.value = 0;
            const disp = this.bookingForm.querySelector(`#${input.id}Value`);
            if (disp) disp.textContent = `0 ${input.getAttribute('data-units') || ''}`.trim();
            this.updateSliderBackground(input);
          } else input.value = '';
          input.removeAttribute('required');
        });
      }
    });
    if (field === 'bookingType') this.displayStep5Sections();
  }

  handleSliderChange(e) {
    // Additional tracking can be added here if needed.
  }

  handleFieldBlur(e) {
    Tracking.sendData(e.target.id.replace('booking-', ''), e.target.value.trim());
  }

  validateFormStep(step) {
    const stepEl = this.bookingForm.querySelector(`.booking-form-step[data-step="${step}"]`);
    if (!stepEl) return true;
    let valid = true;
    Array.from(stepEl.querySelectorAll('input, select, textarea')).forEach(input => {
      if (input.closest('.booking-form-group')?.offsetParent === null) return;
      if (!input.checkValidity()) {
        valid = false;
        input.classList.add('border-red-500');
        const err = input.parentElement.querySelector('.error-message');
        if (err) {
          err.style.display = 'block';
          // err.textContent = input.validationMessage || 'This field is required.';
        }
        input.reportValidity();
      } else {
        input.classList.remove('border-red-500');
        const err = input.parentElement.querySelector('.error-message');
        if (err) err.style.display = 'none';
      }
    });
    if (!valid) Toast.show('Please correct the errors on this step before proceeding.', false);
    return valid;
  }
  updateSessionStorage(key, newData) {
    // Retrieve existing data from sessionStorage
    let existingData = sessionStorage.getItem(key);

    // Parse the data if it exists, otherwise initialize as an empty object
    let dataObject = existingData ? JSON.parse(existingData) : {};

    // Merge the new data into the existing object
    Object.assign(dataObject, newData);

    // Save the updated object back to sessionStorage
    sessionStorage.setItem(key, JSON.stringify(dataObject));
  }

  updateFormData(step) {
    const stepEl = this.bookingForm.querySelector(`.booking-form-step[data-step="${step}"]`);
    if (!stepEl) return;
    const fields = Array.from(stepEl.querySelectorAll('[name]')).filter(Utilities.isVisible);
    let data = {};
    fields.forEach(f => {
      if (f.type === 'radio') {
        if (f.checked) data[f.name] = f.value;
      } else if (f.type === 'checkbox') {
        data[f.name] = data[f.name] || [];
        if (f.checked) data[f.name].push(f.value);
      } else data[f.name] = f.value;
    });
    this.formDataStore = { ...this.formDataStore, ...data, extras: this.formDataStore.extras };
    if (step === 5 && this.formDataStore.bookingType === 'One-Time') {
      this.compileExtras();
      data.extras = this.formDataStore.extras.join(', ');
    }
    this.appendStepData(step, data);
    Object.entries(data).forEach(([fid, val]) => {
      if (Array.isArray(val)) val.forEach(v => Tracking.sendData(fid, v));
      else Tracking.sendData(fid, val);
    });

    this.updateSessionStorage('meta-data', data);

  }

  appendStepData(step, data) {
    const stepEl = Array.from(document.querySelectorAll(`.booking-step[data-step="${step}"]`)).find(Utilities.isVisible);
    if (!stepEl) return;
    let html = '';
    switch (step) {
      case 1:
        html = `<div class="step-value">
          <strong>Full Name:</strong> ${Utilities.sanitizeHTML(data.name || 'N/A')}<br>
          <strong>Email:</strong> ${Utilities.sanitizeHTML(data.email || 'N/A')}<br>
          <strong>Phone:</strong> ${Utilities.sanitizeHTML(data.phone || 'N/A')}
        </div>`;
        break;
      case 2:
        html = `<div class="step-value"><strong>Industry:</strong> ${Utilities.sanitizeHTML(data.industry || 'N/A')}</div>`;
        break;
      case 3:
        html = data.bookingType === 'Recurring'
          ? `<div class="step-value">
            <strong>Booking Type:</strong> Recurring<br>
            <strong>Frequency:</strong> ${Utilities.sanitizeHTML(data.frequency || 'N/A')}
          </div>`
          : `<div class="step-value">
            <strong>Booking Type:</strong> One-Time<br>
            <strong>Service Type:</strong> ${Utilities.sanitizeHTML(data.serviceType || 'N/A')}
          </div>`;
        break;
      case 4:
        html = `<div class="step-value">
          <strong>Square Footage:</strong> ${Utilities.sanitizeHTML(data.squareFootage || 'N/A')} sq ft<br>
          <strong>Bedrooms:</strong> ${Utilities.sanitizeHTML(data.bedrooms || 'N/A')}<br>
          <strong>Bathrooms:</strong> ${Utilities.sanitizeHTML(data.bathrooms || 'N/A')}<br>
          <strong>Powder Rooms:</strong> ${Utilities.sanitizeHTML(data.powderRooms || 'N/A')}
        </div>`;
        break;
      case 5:
        html = this.formDataStore.bookingType === 'One-Time'
          ? `<div class="step-value"><strong>Extras:</strong> ${Utilities.sanitizeHTML(this.formDataStore.extras?.join(', ') || 'None')}</div>`
          : `<div class="step-value"><strong>Package:</strong> ${Utilities.sanitizeHTML(data.package || 'N/A')} Hours</div>`;
        break;
      case 6:
        html = `<div class="step-value">
          <strong>Address:</strong> ${Utilities.sanitizeHTML(data.address || 'N/A')}<br>
          <strong>Preferred Date:</strong> ${Utilities.sanitizeHTML(data.date || 'N/A')}<br>
          <strong>Additional Details:</strong> ${Utilities.sanitizeHTML(data.details || 'N/A')}
        </div>`;
        break;
      default:
        break;
    }
    const existing = stepEl.querySelector('.step-summary .step-value');
    if (existing) existing.remove();
    stepEl.querySelector('.step-summary').insertAdjacentHTML('beforeend', html);
  }

  togglePackageOption(lbl) {
    this.bookingForm.querySelectorAll('.package-option').forEach(l => l.classList.remove('active'));
    lbl.classList.add('active');
  }

  displayStep5Sections() {
    const type = this.formDataStore.bookingType;
    const step5 = this.bookingForm.querySelector('.booking-form-step[data-step="5"]');
    if (!step5) return;
    const extrasGroup = step5.querySelector('[data-conditional-field="bookingType"][data-conditional-value="One-Time"]');
    const packageGroup = step5.querySelector('[data-conditional-field="bookingType"][data-conditional-value="Recurring"]');
    if (type === 'Recurring') {
      Utilities.toggleVisibility('selectPackage', 'selectExtras');
      if (extrasGroup) {
        extrasGroup.style.display = 'none';
        extrasGroup.setAttribute('aria-hidden', 'true');
        extrasGroup.querySelectorAll('input, select, textarea').forEach(i => i.removeAttribute('required'));
        this.resetExtrasSliders();
      }
      if (packageGroup) {
        packageGroup.style.display = 'block';
        packageGroup.setAttribute('aria-hidden', 'false');
        packageGroup.querySelectorAll('input, select, textarea').forEach(i => i.setAttribute('required', 'required'));
      }
    } else if (type === 'One-Time') {
      Utilities.toggleVisibility('selectExtras', 'selectPackage');
      if (packageGroup) {
        packageGroup.style.display = 'none';
        packageGroup.setAttribute('aria-hidden', 'true');
        packageGroup.querySelectorAll('input, select, textarea').forEach(i => i.removeAttribute('required'));
        this.resetPackageSelections();
      }
      if (extrasGroup) {
        extrasGroup.style.display = 'block';
        extrasGroup.setAttribute('aria-hidden', 'false');
        this.initializeSliderValues();
      }
    } else {
      if (extrasGroup) {
        extrasGroup.style.display = 'none';
        extrasGroup.setAttribute('aria-hidden', 'true');
        extrasGroup.querySelectorAll('input, select, textarea').forEach(i => i.removeAttribute('required'));
        this.resetExtrasSliders();
      }
      if (packageGroup) {
        packageGroup.style.display = 'none';
        packageGroup.setAttribute('aria-hidden', 'true');
        packageGroup.querySelectorAll('input, select, textarea').forEach(i => i.removeAttribute('required'));
        this.resetPackageSelections();
      }
    }
  }

  initializeSliderValues() {
    const countableExtras = ['windows', 'windowBlinds', 'ceilingFans', 'laundryFolding'];
    countableExtras.forEach(extra => {
      const slider = document.getElementById(`${extra}Slider`);
      const display = document.getElementById(`${extra}CountDisplay`);
      if (slider && display) {
        const storedValue = this.formDataStore[`${extra}Count`] || 0;
        slider.value = storedValue;
        display.textContent = `${storedValue} ${slider.getAttribute('data-units') || ''}`.trim();
        this.updateSliderBackground(slider);
      }
    });
  }

  initializeRangeDisplays() {
    Array.from(this.bookingForm.querySelectorAll("input[type='range']")).forEach(input => {
      const disp = this.bookingForm.querySelector(`#${input.id}Value`);
      if (disp) {
        const label = input.getAttribute('data-units') || '';
        disp.textContent = `${input.value} ${label}`.trim();
        this.updateSliderBackground(input);
        input.addEventListener('input', () => {
          disp.textContent = `${input.value} ${label}`.trim();
          this.updateSliderBackground(input);
        });
      }
    });
  }

  resetForm() {
    this.currentStep = 1;
    this.showFormStep(1);
    this.stepTracker.showFormStep(1);
    this.stepTracker.updateClickableSteps();
    this.bookingForm.reset();
    Array.from(this.bookingForm.querySelectorAll("[data-conditional-field]")).forEach(wrapper => {
      wrapper.style.display = 'none';
      wrapper.setAttribute('aria-hidden', 'true');
      Array.from(wrapper.querySelectorAll("input, select, textarea")).forEach(i => {
        if (['radio', 'checkbox'].includes(i.type)) i.checked = false;
        else i.value = '';
        i.removeAttribute('required');
      });
    });
    Array.from(this.bookingForm.querySelectorAll(".booking-btn-option")).forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    });
    this.formDataStore = {};
    Array.from(document.querySelectorAll(".booking-step")).forEach(s => {
      s.classList.remove('completed', 'active', 'clickable');
      s.setAttribute('aria-disabled', 'true');
      const sum = s.querySelector(".step-summary .step-value");
      if (sum) sum.remove();
    });
    const first = document.querySelector(`.booking-step[data-step="1"]`);
    if (first) {
      first.classList.add('clickable', 'active');
      first.setAttribute('aria-disabled', 'false');
      first.setAttribute('aria-current', 'step');
    }
    this.stepTracker.updateClickableSteps();
    const label = document.querySelector(`.booking-step[data-step="1"] .booking-step-label`).textContent;
    const title = document.getElementById("bookingFormTitle");
    if (title) title.textContent = label;
    this.initializeRangeDisplays();
  }

  resetPackageSelections() {
    Array.from(this.bookingForm.querySelectorAll(`[data-conditional-field="bookingType"][data-conditional-value="Recurring"] input[type="radio"]`))
      .forEach(i => i.checked = false);
    Array.from(this.bookingForm.querySelectorAll(`[data-conditional-field="bookingType"][data-conditional-value="Recurring"] label.booking-btn-option`))
      .forEach(l => l.classList.remove('active'));
  }

  resetExtrasSliders() {
    ['windows', 'windowBlinds', 'ceilingFans', 'laundryFolding'].forEach(extra => {
      const slider = document.getElementById(`${extra}Slider`);
      const disp = document.getElementById(`${extra}CountDisplay`);
      if (slider && disp) {
        slider.value = 0;
        disp.textContent = `0 ${slider.getAttribute('data-units') || ''}`.trim();
        this.formDataStore[`${extra}Count`] = 0;
        this.updateSliderBackground(slider);
      }
    });
  }

  compileExtras() {
    this.formDataStore.extras = Array.isArray(this.formDataStore.extras)
      ? this.formDataStore.extras.filter(e => !e.match(/\(\d+\)$/))
      : typeof this.formDataStore.extras === 'string'
        ? this.formDataStore.extras.split(', ').map(s => s.trim()).filter(e => !e.match(/\(\d+\)$/))
        : [];
    ['windows', 'windowBlinds', 'ceilingFans', 'laundryFolding'].forEach(extra => {
      const count = this.formDataStore[`${extra}Count`];
      if (count > 0) {
        const dispName = extra.replace(/([A-Z])/g, ' $1').trim();
        this.formDataStore.extras.push(`${dispName} (${count})`);
      }
    });
    if (!Array.isArray(this.formDataStore.extras)) this.formDataStore.extras = [];
  }

  initializeExtrasCountInputs() {
    const extras = [
      { name: 'windows' },
      { name: 'windowBlinds' },
      { name: 'ceilingFans' },
      { name: 'laundryFolding' }
    ];
    extras.forEach(item => {
      const container = document.getElementById(`${item.name}SliderContainer`),
        slider = document.getElementById(`${item.name}Slider`),
        disp = document.getElementById(`${item.name}CountDisplay`);
      if (container && slider && disp) {
        container.style.display = 'flex';
        disp.textContent = slider.value;
        this.updateSliderBackground(slider);
        this.formDataStore[`${item.name}Count`] = +slider.value;
        slider.addEventListener('input', () => {
          disp.textContent = slider.value;
          this.formDataStore[`${item.name}Count`] = +slider.value;
          this.appendStepData(this.currentStep, this.formDataStore);
          this.updateSliderBackground(slider);
        });
      }
    });
  }

  handleExtrasButtonClick(button) {
    const value = button.getAttribute('data-value');
    const isPressed = button.getAttribute('aria-pressed') === 'true';
    if (isPressed) {
      button.setAttribute('aria-pressed', 'false');
      button.classList.remove('active');
      if (Array.isArray(this.formDataStore.extras)) {
        this.formDataStore.extras = this.formDataStore.extras.filter(item => item !== value);
      }
    } else {
      button.setAttribute('aria-pressed', 'true');
      button.classList.add('active');
      if (!Array.isArray(this.formDataStore.extras)) {
        this.formDataStore.extras = [];
      }
      this.formDataStore.extras.push(value);
    }
    this.appendStepData(this.currentStep, { extras: this.formDataStore.extras });
    Tracking.sendData('extras', this.formDataStore.extras.join(', '));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.BookingFormInstance = new BookingForm();
});
