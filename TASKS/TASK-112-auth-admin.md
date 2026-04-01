## Task 112: Auth - Admin Session for Statamic CMS
**Phase:** 1 | **Agent:** backend
**Priority:** High | **Status:** TODO
**Est. Effort:** S | **Dependencies:** TASK-100

### Context
The site owner needs to log into the Statamic control panel to manage content and products. Statamic Core free tier supports 1 admin user. This task ensures auth is configured securely with no public registration.

### What Needs Doing
1. Create the first (and only) admin user via `php artisan statamic:make:user`
2. Disable public user registration in Statamic config
3. Ensure the Statamic control panel is only accessible at `/cp` (default)
4. Configure session security: `SESSION_DRIVER=file` (or `cookie`), `SESSION_LIFETIME=120`, `SESSION_SECURE_COOKIE=true` in production
5. Ensure CSRF protection is active on the control panel
6. Add `/cp` to any rate limiting rules (TASK-113) to prevent brute force on login
7. Verify that Statamic's built-in auth guards work correctly with Laravel 12

### Files
- `config/statamic/users.php`
- `config/session.php`
- `.env.example` (session config vars)
- `users/` directory (Statamic flat-file user storage)

### How to Test
- Admin can log in at `/cp` with correct credentials
- Invalid credentials are rejected with appropriate error
- No public registration route exists
- Session expires after configured lifetime
- CSRF token is required for login form submission

### Unexpected Outcomes
- Statamic auth conflicts with Laravel 12 default auth scaffolding - remove any conflicting auth routes
- Session storage issues on Railway (file permissions) - switch to cookie or database driver

### On Completion
No further dependencies from this task.
