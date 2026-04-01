## Task 115: Contact Form Endpoint
**Phase:** 2 | **Agent:** backend
**Priority:** Low | **Status:** TODO
**Est. Effort:** S | **Dependencies:** TASK-101, TASK-110

### Context
The site has a contact form (Statamic Core free tier includes 1 form). The backend validates the submission, stores it in the database, and sends a notification email to the site owner via Resend.

### What Needs Doing
1. Create `app/Http/Controllers/Api/ContactController.php`
2. `POST /api/contact` - validate and store contact form submission:
   - Required fields: `name` (string, max 255), `email` (valid email, max 255), `message` (string, max 5000)
   - Store in `contact_submissions` table with `ip_address` (for spam tracking)
   - Send notification email to site owner (configurable recipient in `.env`)
   - Return 201 with success message
3. Create `app/Mail/ContactFormNotification.php` - email to owner containing the submission details
4. Create Blade template `resources/views/emails/contact-form.blade.php`
5. Add basic spam protection: honeypot field (reject if filled) and rate limiting (TASK-113 covers rate limit)
6. Add route in `routes/api.php` with `api-contact` rate limiter

### Files
- `app/Http/Controllers/Api/ContactController.php`
- `app/Mail/ContactFormNotification.php`
- `resources/views/emails/contact-form.blade.php`
- `routes/api.php`
- `.env.example` (`CONTACT_FORM_RECIPIENT`)

### How to Test
- Valid submission returns 201 and creates DB record
- Missing required field returns 422 with validation errors
- Honeypot field filled returns 422 (silently reject spam)
- Owner receives notification email with submission details
- IP address is stored on the record
- Rate limit (3/min) rejects excessive submissions

### Unexpected Outcomes
- Spam volume too high despite honeypot + rate limiting - consider adding a simple CAPTCHA (but flag first, as it adds frontend complexity)
- Resend email to owner fails - log error, but still store submission in DB (owner can view in Statamic CP)

### On Completion
No further dependencies from this task.
