## Task 308: Contact Form Submissions in CMS Admin
**Phase:** 3 | **Agent:** cms
**Priority:** Medium | **Status:** TODO
**Est. Effort:** S | **Dependencies:** TASK-300, TASK-304

### Context
The contact form is handled by Statamic's built-in form feature (included in Core free tier - 1 form). Submissions should be viewable in the control panel so the owner can read and respond to customer messages.

### What Needs Doing
1. Create a Statamic form called `contact` with fields:
   - name (text, required)
   - email (email, required)
   - message (textarea, required, max 2000 chars)
   - honeypot field for basic spam protection (Statamic has built-in honeypot support)
2. Configure the form in `resources/forms/contact.yaml`
3. Enable the submission listing in the control panel - confirm submissions are viewable under Forms > Contact
4. Configure email notification: when a form is submitted, send an email to the owner's configured email address via Resend (uses Laravel mail driver)
5. Add basic rate limiting to the form endpoint to prevent spam floods (e.g. max 5 submissions per IP per hour)
6. Ensure the form submission endpoint returns structured JSON (for the static frontend to consume via fetch/AJAX)
7. Create a Blade partial `resources/views/forms/contact.blade.php` as a reference for the frontend agent (though the actual form will be in static HTML calling the API)

### Files
- `resources/forms/contact.yaml`
- `resources/blueprints/forms/contact.yaml`
- `config/statamic/forms.php`
- `resources/views/forms/contact.blade.php` (reference template)

### How to Test
- Submit the contact form via the API endpoint with valid data - confirm a 200 response
- Check the control panel under Forms > Contact - confirm the submission appears with name, email, message, and timestamp
- Submit with missing required fields - confirm validation errors return as structured JSON
- Submit 6 times rapidly from the same IP - confirm the 6th is rate-limited
- Confirm the honeypot field rejects submissions where it is filled in
- Confirm the owner receives an email notification for each legitimate submission

### Unexpected Outcomes
- If Statamic 6 form API responses have changed format, flag for frontend agent
- If the free tier's 1-form limit prevents adding additional forms later, document this limitation
- If Resend integration requires additional config beyond Laravel's mail driver, flag for backend agent

### On Completion
Contact form is fully configured. Feeds into TASK-309 (owner runbook).
