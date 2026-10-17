# TASK-317 - Seed Execution Output

**Result: PASS.** All acceptance criteria met. This supersedes the prior report in
this file, which recorded a FAIL (403 - API key not authenticating, root-caused and
fixed by Flynn regenerating the key in the admin UI before this run).

## 0. Pre-check (per orchestrator instruction, before touching the seeder)

```
set -a; . /srv/skeleton/clients/centrifungal/.env; set +a
docker exec -e PAYLOAD_API_KEY="$PAYLOAD_API_KEY" payload-centrifungal node -e '
  const key = process.env.PAYLOAD_API_KEY;
  fetch("http://localhost:3000/api/users/me", { headers: { Authorization: `users API-Key ${key}` } })
    .then(async r => { const j = await r.json(); console.log("status:", r.status, "user_present:", !!j.user, "email:", j.user ? j.user.email : null); });
'
```
Result: `status: 200 user_present: true email: fdavies.freelance@gmail.com`

Key now authenticates correctly. Proceeded with the full run. No secret value was
printed at any point - only referenced by variable name (`$PAYLOAD_API_KEY`), sourced
from `/srv/skeleton/clients/centrifungal/.env` via `set -a; . <file>; set +a`.

## 1. Checksum verify + copy-in

```
md5 -q scripts/cms/seed.mjs                                                  # a2037f391ab041ee76624fe2ed0af02f (local)
ssh skeleton "md5sum /srv/skeleton/build/centrifungal/scripts/cms/seed.mjs"  # same (box)
docker cp /srv/skeleton/build/centrifungal/scripts/cms/seed.mjs payload-centrifungal:/tmp/seed.mjs
docker exec payload-centrifungal md5sum /tmp/seed.mjs                        # same (in-container)
```
All three copies matched (`a2037f391ab041ee76624fe2ed0af02f`) before running.

## 2. First seed run - full stdout (all creates)

```
set -a; . /srv/skeleton/clients/centrifungal/.env; set +a
docker exec \
  -e PAYLOAD_API_URL=http://localhost:3000/api \
  -e PAYLOAD_API_KEY="$PAYLOAD_API_KEY" \
  payload-centrifungal node /tmp/seed.mjs
```
```
Seeding Centrifungal CMS at http://localhost:3000/api
Categories:
  + category grow-logs
  + category colonised-dowels
  + category diy-kits
  + category tinctures
Site settings:
  + site-settings populated
Pages:
  + page about
  + page contact
  + page faq
  + page care-instructions
Done. (No products seeded - add them in the admin. Upload logo/hero images in the admin.)
```
Exit 0. No errors.

## 3. Validation GETs

**Product categories** (`GET /api/product-categories?limit=10`) - `totalDocs: 4`,
slugs present: `grow-logs`, `colonised-dowels`, `diy-kits`, `tinctures` (all fields
- name, description, icon, sortOrder - match the seeder's source data).

**Site settings** (`GET /api/globals/site-settings`) - populated (no longer the empty
default). `navLinks.length === 6` (Home/Shop/About/Care/FAQ/Contact, correct order),
`siteName: "Centrifungal"`. Full copy block (hero, story, USP cards, footer columns,
meta) all present and matches the seeder's `SITE_SETTINGS` constant.

**Pages** (`GET /api/pages?limit=10`) - `totalDocs: 4`, slugs present: `about`,
`contact`, `faq`, `care-instructions`. Titles/subtitles/meta all match source.

## 4. Idempotency

Ran the **identical** command a second time (same env sourcing, same
`docker exec ... node /tmp/seed.mjs`):
```
Seeding Centrifungal CMS at http://localhost:3000/api
Categories:
  = category grow-logs exists, skip
  = category colonised-dowels exists, skip
  = category diy-kits exists, skip
  = category tinctures exists, skip
Site settings:
  = site-settings already populated, skip
Pages:
  = page about exists, skip
  = page contact exists, skip
  = page faq exists, skip
  = page care-instructions exists, skip
Done. ...
```
Zero `+` (create) lines - all skips, as expected. Re-checked counts after the second
run: `product-categories totalDocs: 4`, `pages totalDocs: 4` - **unchanged**, confirming
no duplicates were created.

## 5. Lexical round-trip

**`care-instructions` page** (`layout[0].body.root.children`, `blockType: textBlock`):
structural summary of what came back from the API -
- 1 `paragraph` ("Congratulations on your new grow log! ...")
- 1 `heading` (`tag: "h2"`, "Getting Started")
- 1 `list` (`tag: "ol"`, `listType: "number"`) with exactly **4** `listitem` children,
  text matching the 4 seeded steps in order

Matches the expected shape (1 paragraph + 1 h2 + 1 ordered list of 4 items) exactly -
no rejection, no normalisation/reshaping observed on any field (`type`, `tag`,
`format`, `indent`, `version`, `direction`, `children` all present and structurally
identical to what the seeder sent).

**`faq` page** (`layout[0]`, `blockType: faqGroup`): `items.length === 6`, each with
`question` and `answer` text intact and matching source verbatim.

Both round-trips are the strongest available automated evidence that Payload accepted
and stored the hand-built Lexical/block shapes without rejecting or altering them. Per
the orchestrator's decision, the admin-UI render eyeball check is deferred to TASK-319
(editor parity) and is not required for TASK-317 acceptance.

## 6. Cleanup

`docker exec -u root payload-centrifungal rm -f /tmp/seed.mjs` - confirmed removed
(`ls /tmp/seed.mjs` -> No such file or directory). `-u root` was needed again: the file
copied in via `docker cp` is owned by `node:node` while the container process runs as
`payload` (uid 1001), so a same-user `rm` gets `Operation not permitted`.

## 7. Anything unexpected

Nothing unexpected in this run - it went exactly per plan once the API key was valid.
(The one surprise - the original invalid/never-enabled API key - was root-caused and
resolved in the prior FAIL report/session, not in this run.)

## 8. PASS/FAIL against acceptance criteria

| Criterion | Result |
|---|---|
| 4 product categories created (grow-logs, colonised-dowels, diy-kits, tinctures) | **PASS** |
| SiteSettings global populated (navLinks.length===6, siteName "Centrifungal") | **PASS** |
| 4 pages created (about, contact, faq, care-instructions) | **PASS** |
| Idempotent re-run (skip-only, no dupes, counts unchanged) | **PASS** |
| Lexical richtext + faqGroup block round-trip verified via API | **PASS** |

**Overall: PASS.** TASK-317 acceptance criteria fully met. No secrets were echoed,
nothing was committed/pushed/merged, and no manual DB writes or workarounds were used
in this run.

---

OUTPUT READY — task-317-seed-output.md written
