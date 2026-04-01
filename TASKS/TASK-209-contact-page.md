## Task 209: Contact Page (Form UI)
**Phase:** 3 | **Agent:** frontend
**Priority:** Medium | **Status:** TODO
**Est. Effort:** M | **Dependencies:** TASK-201

### Context
The contact form is one of the features included in Statamic Core free tier (1 form). The frontend builds the form UI; submission goes to the Statamic form handler on the backend.

### What Needs Doing
1. Build a contact page with:
   - **Page header:** title and intro text.
   - **Contact form:** name, email, subject (dropdown: General Enquiry, Order Question, Wholesale, Other), message (textarea).
   - **Client-side validation:** required fields, email format check. Show inline error messages.
   - **Submit button:** loading state during submission. Disable to prevent double-submit.
   - **Success state:** replace form with a thank-you message on successful submission.
   - **Error state:** show error message if submission fails.
   - **Additional info:** business location, email address, social links (alongside or below the form).
2. Form submits via `POST` to the Statamic form endpoint (or a placeholder URL for now).
3. Use form input components from TASK-201.

### Files
- `src/contact.html` (create)
- `src/js/contact.js` (create - validation, submission, state management)

### How to Test
- Form renders with all fields and correct input types.
- Submitting with empty required fields shows inline validation errors.
- Submitting with invalid email format shows email validation error.
- Successful submission (mock or real endpoint) shows thank-you message and hides form.
- Failed submission shows error message and preserves form data.
- Submit button shows loading state and is disabled during submission.

### Unexpected Outcomes
- If Statamic form endpoint URL or CSRF token requirements differ from assumptions, flag for backend/CMS sync.

### On Completion
Queue TASK-210 (FAQ Page).
