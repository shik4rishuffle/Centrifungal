## Task 300: Statamic 6 CMS Configuration
**Phase:** 3 | **Agent:** cms
**Priority:** High | **Status:** TODO
**Est. Effort:** M | **Dependencies:** none

### Context
Everything else in the CMS layer depends on a working Statamic 6 installation with the control panel enabled, an admin user created, and sensible defaults configured. This is the foundation task.

### What Needs Doing
1. Install Statamic 6 into the existing Laravel 12 project (if not already scaffolded by backend agent)
2. Enable the control panel in `config/statamic/cp.php` - set route prefix to `/cp`
3. Create the owner admin user via `php please make:user` with super admin role
4. Configure `config/statamic/system.php` - set locale to `en_GB`, timezone to `Europe/London`
5. Set `config/statamic/editions.php` to `core` (free tier - 1 user, 1 form)
6. Confirm Blade is the configured template engine (not Antlers) per architect decision
7. Disable public user registration - confirm `config/statamic/users.php` has no public registration routes
8. Configure `.env` entries for `APP_URL` pointing to the Railway backend domain
9. Ensure the control panel is only accessible over HTTPS in production (enforce via middleware or Railway config)

### Files
- `config/statamic/cp.php`
- `config/statamic/system.php`
- `config/statamic/editions.php`
- `config/statamic/users.php`
- `resources/users/*.yaml` (admin user file)
- `.env` / `.env.example`

### How to Test
- Visit `/cp` and confirm the login screen loads
- Log in with the owner credentials and confirm super admin access
- Confirm no public registration link exists on the login page
- Confirm Blade templates are being used (create a test route rendering a Blade view with Statamic data)
- Confirm locale displays dates in UK format (dd/mm/yyyy)

### Unexpected Outcomes
- If Statamic 6 is not yet compatible with the installed Laravel 12 version, flag the version mismatch
- If the free tier restricts any required feature (forms, users), flag immediately

### On Completion
Queue TASK-301 (Bard block types) and TASK-305 (image upload handling) - both can run in parallel.
