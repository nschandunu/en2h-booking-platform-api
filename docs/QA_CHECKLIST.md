# QA Testing Checklist

## Authentication
- [x] Register (valid)
- [x] Register (duplicate email)
- [x] Register (invalid email)
- [x] Register (weak password)
- [x] Login (valid)
- [x] Login (wrong password)

## Services
- [x] Create service
- [x] Duplicate title (409)
- [x] Get all (pagination, search, filter)
- [x] Update service
- [x] Delete service

## Bookings
- [x] Create booking (valid)
- [x] Non-existing service (404)
- [x] Inactive service (400)
- [x] Past date (400)
- [x] Duplicate booking (409)
- [x] Status transition (PENDING -> CONFIRMED)
- [x] Status transition (CONFIRMED -> COMPLETED)
- [x] Invalid transition (CANCELLED -> COMPLETED)
- [x] Invalid transition (COMPLETED -> PENDING)
- [x] Cancel booking
- [x] Pagination & Filtering

## Edge Cases & Errors
- [ ] Invalid UUID for serviceId
- [ ] Missing required fields
- [ ] SQL Injection attempt

## Ecosystem
- [ ] Build Verification (npm run build)
- [ ] Docker Startup (docker compose up --build)
- [ ] Fresh Install Test
