## Task 108: Royal Mail Click & Drop API Integration
**Phase:** 3 | **Agent:** backend
**Priority:** High | **Status:** TODO
**Est. Effort:** L | **Dependencies:** TASK-100

### Context
Royal Mail Click & Drop is the shipping integration. Orders are pushed via their REST API with customer address and item details. The API returns an order reference used to track the shipment. This service is consumed by the fulfilment flow (TASK-107).

### What Needs Doing
1. Create `app/Services/RoyalMailService.php`
2. Implement `pushOrder(Order $order): RoyalMailResponse` method:
   - POST to Click & Drop API endpoint (`https://api.parcel.royalmail.com/api/0/orders`)
   - Headers: `Authorization: Bearer {api_key}`, `Content-Type: application/json`
   - Body: recipient name, address lines, city, county, postcode, country code (GB), items array with description, quantity, weight, value
   - Parse response for order ID / reference number
3. Implement `getOrderStatus(string $royalMailOrderId): TrackingInfo` method for the polling cron (TASK-109)
4. Add retry logic with exponential backoff (1s, 2s, 4s) on transient failures (5xx, timeout)
5. Log all API requests and responses (sanitise PII in logs - omit full address, keep postcode prefix only)
6. Create a config block in `config/services.php` for Royal Mail API base URL and key
7. Create a DTO: `app/DTOs/RoyalMailResponse.php` for typed API responses

### Files
- `app/Services/RoyalMailService.php`
- `app/DTOs/RoyalMailResponse.php`
- `config/services.php`

### How to Test
- Mock Royal Mail API and verify correct request body structure
- Successful push returns order ID and stores it on the order
- 5xx response triggers retry
- 4xx response (bad request) does not retry and logs error details
- PII is not written to logs in full

### Unexpected Outcomes
- Click & Drop API authentication model has changed - check current docs and flag
- API rate limiting encountered (unlikely at <20 orders/day but possible during retries) - implement rate limit awareness
- Click & Drop API requires additional fields not in our order schema - flag missing fields

### On Completion
Queue TASK-107 (fulfilment flow depends on this service being ready).
