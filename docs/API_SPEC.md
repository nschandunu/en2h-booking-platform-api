# API Specification

## Authentication

- POST /auth/register
- POST /auth/login

## Services

- GET /services
- GET /services/:id
- POST /services
- PATCH /services/:id
- DELETE /services/:id

## Bookings

- GET /bookings
- GET /bookings/:id
- POST /bookings
- PATCH /bookings/:id/status

## Standard Response Shape

```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": {}
}
```

## Error Shape

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

## Status Codes

- 200 OK
- 201 Created
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 409 Conflict
