## Task 305: Image Upload Handling
**Phase:** 3 | **Agent:** cms
**Priority:** High | **Status:** TODO
**Est. Effort:** M | **Dependencies:** TASK-300

### Context
The owner will upload product photos and page images regularly. Uploads must be validated server-side to prevent oversized files, wrong formats, or storage abuse. The asset container config also determines where images are stored and how they are served.

### What Needs Doing
1. Create asset containers:
   - **product-images** - for product photos, stored in `storage/app/public/products/`
   - **page-images** - for page content images (Bard blocks), stored in `storage/app/public/pages/`
2. Configure server-side upload validation in each container:
   - Allowed types: `jpg`, `jpeg`, `png`, `webp`
   - Max file size: 5MB per image
   - No SVG, GIF, or other formats (reduces attack surface)
3. Configure image manipulation (Statamic Glide integration):
   - Product images: generate thumbnails at 400x400 and detail view at 1200x1200
   - Page images: max width 1600px, auto-compress to 80% quality
   - Serve WebP where browser supports it
4. Set the public disk symlink (`php artisan storage:link`) - ensure this is included in the deployment script
5. Add validation error messages in plain English: "Image must be a JPG, PNG, or WebP file" and "Image must be smaller than 5MB"
6. Test that oversized and wrong-format uploads are rejected with the friendly error message

### Files
- `content/assets/product-images.yaml`
- `content/assets/page-images.yaml`
- `config/statamic/assets.php`
- `config/filesystems.php` (public disk config)
- Deployment script (add `storage:link` step)

### How to Test
- Upload a 3MB JPG to product-images - confirm it succeeds
- Upload a 6MB JPG - confirm it is rejected with "Image must be smaller than 5MB"
- Upload a `.svg` file - confirm it is rejected with "Image must be a JPG, PNG, or WebP file"
- Upload a `.php` file disguised as `.jpg` - confirm it is rejected (MIME type validation, not just extension)
- Confirm Glide-generated thumbnails are created and served correctly
- Confirm WebP conversion works when requested via Glide URL parameters

### Unexpected Outcomes
- If Railway's persistent volume path differs from local dev storage paths, flag for backend agent to reconcile
- If Glide is not included in Statamic 6 Core, flag - may need a separate image processing package
- If MIME type validation is not built into Statamic's asset upload, flag for custom validation middleware

### On Completion
Image handling is production-ready. No blocking dependencies - but TASK-302 (product blueprint) references the product-images container, so confirm it is correctly linked.
