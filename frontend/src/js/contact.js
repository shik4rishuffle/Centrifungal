/* ==========================================================================
   Contact Form Handler
   Handles validation, honeypot check, and submission to POST /api/contact.
   ========================================================================== */

(function () {
  'use strict';

  const form = document.getElementById('contact-form');
  const feedback = document.getElementById('contact-feedback');
  const submitBtn = document.getElementById('contact-submit');

  if (!form) return;

  /**
   * Show inline error for a specific field.
   */
  function showFieldError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const error = document.getElementById(fieldId + '-error');
    if (input) input.classList.add('form-input--error');
    if (error) error.textContent = message;
  }

  /**
   * Clear inline error for a specific field.
   */
  function clearFieldError(fieldId) {
    const input = document.getElementById(fieldId);
    const error = document.getElementById(fieldId + '-error');
    if (input) input.classList.remove('form-input--error');
    if (error) error.textContent = '';
  }

  /**
   * Clear all field errors.
   */
  function clearAllErrors() {
    clearFieldError('contact-name');
    clearFieldError('contact-email');
    clearFieldError('contact-message');
    feedback.className = 'form-feedback';
    feedback.textContent = '';
  }

  /**
   * Show form-level feedback (success or error).
   */
  function showFeedback(type, message) {
    feedback.className = 'form-feedback form-feedback--' + type;
    feedback.textContent = message;
    feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * Simple email validation.
   */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Validate all form fields. Returns true if valid.
   */
  function validate() {
    let valid = true;

    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();
    const message = form.elements.message.value.trim();

    if (!name) {
      showFieldError('contact-name', 'Please enter your name.');
      valid = false;
    }

    if (!email) {
      showFieldError('contact-email', 'Please enter your email address.');
      valid = false;
    } else if (!isValidEmail(email)) {
      showFieldError('contact-email', 'Please enter a valid email address.');
      valid = false;
    }

    if (!message) {
      showFieldError('contact-message', 'Please enter a message.');
      valid = false;
    }

    return valid;
  }

  /**
   * Handle form submission.
   */
  async function handleSubmit(event) {
    event.preventDefault();
    clearAllErrors();

    /* Honeypot check - if filled in, silently pretend success */
    const honeypot = form.elements.phone_confirm;
    if (honeypot && honeypot.value) {
      showFeedback('success', 'Thanks for your message. We will get back to you soon.');
      form.reset();
      return;
    }

    if (!validate()) {
      return;
    }

    /* Disable button while submitting */
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    const payload = {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      message: form.elements.message.value.trim()
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showFeedback('success', 'Thanks for your message. We will get back to you as soon as we can.');
        form.reset();
      } else {
        let errorMessage = 'Something went wrong. Please try again or email us directly.';
        try {
          const data = await response.json();
          if (data && data.error) {
            errorMessage = data.error;
          }
        } catch (e) {
          /* Response was not JSON - use default message */
        }
        showFeedback('error', errorMessage);
      }
    } catch (err) {
      showFeedback('error', 'Could not send your message. Please check your connection and try again, or email us at hello@centrifungal.co.uk.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
    }
  }

  /* Clear field errors on input */
  ['contact-name', 'contact-email', 'contact-message'].forEach(function (fieldId) {
    const input = document.getElementById(fieldId);
    if (input) {
      input.addEventListener('input', function () {
        clearFieldError(fieldId);
      });
    }
  });

  form.addEventListener('submit', handleSubmit);
})();
