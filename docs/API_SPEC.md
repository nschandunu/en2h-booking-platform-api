# API Specification

This document details the complete API surface of the EN2H Booking Platform. All endpoints are prefixed with `/api/v1`.

> **Swagger / OpenAPI**: An interactive Swagger UI is available at `http://localhost:3000/docs` when running the application. It provides real-time schema testing and documentation dynamically generated from the NestJS controllers.

---

## 1. Authentication Module

### Register a User
- **Method**: `POST`
- **Route**: `/auth/register`
- **Authentication**: None
- **Validation**: Strict email format, strong password enforcement (minimum 8 chars, uppercase, symbol).
- **Request Body**:
  ```json
  {
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "SuperSecretPassword123!"
  }
  ```
- **Responses**:
  - `201 Created`: User successfully registered.
  - `400 Bad Request`: Validation failure.
  - `409 Conflict`: Email already exists.

### Login
- **Method**: `POST`
- **Route**: `/auth/login`
- **Authentication**: None
- **Request Body**:
  ```json
  {
    "email": "admin@example.com",
    "password": "SuperSecretPassword123!"
  }
  ```
- **Responses**:
  - `200 OK`: Returns `{ data: { user: {...}, accessToken: "...", refreshToken: "..." } }`.
  - `401 Unauthorized`: Invalid credentials.

### Refresh Token
- **Method**: `POST`
- **Route**: `/auth/refresh`
- **Authentication**: Bearer Token (Refresh Token)
- **Description**: Rotates the JWT tokens to maintain a persistent secure session.
- **Responses**:
  - `200 OK`: Returns new `accessToken` and `refreshToken`.
  - `401 Unauthorized`: Token expired or tampered.

### Logout
- **Method**: `POST`
- **Route**: `/auth/logout`
- **Authentication**: Bearer Token (Access Token)
- **Description**: Invalidates the refresh token securely in the database.
- **Responses**:
  - `200 OK`: Successfully logged out.

---

## 2. Health Module

### Liveness Probe
- **Method**: `GET`
- **Route**: `/health`
- **Authentication**: None
- **Responses**:
  - `200 OK`: `{ success: true, message: "Health check successful", data: { status: "ok" } }`

---

## 3. Services Module

### Create a Service
- **Method**: `POST`
- **Route**: `/services`
- **Authentication**: Required (Bearer Token)
- **Validation**: `title` must be unique. `price` must be a valid positive decimal.
- **Request Body**:
  ```json
  {
    "title": "Premium Detailing",
    "description": "Full interior and exterior detailing.",
    "duration": 120,
    "price": 99.99
  }
  ```
- **Responses**: `201 Created`, `400 Bad Request`, `401 Unauthorized`.

### Get All Services
- **Method**: `GET`
- **Route**: `/services`
- **Authentication**: None
- **Validation**: `limit` is capped at `@Max(100)`.
- **Query Parameters**:
  - `page` (optional): Offset pagination. Default `1`.
  - `limit` (optional): Items per page. Default `10`.
  - `search` (optional): Text search across title and description.
  - `active` (optional): Filter by boolean active state.
- **Example Usage**: `GET /services?page=2&limit=5&search=Detailing&active=true`
- **Responses**: `200 OK` returning `{ data: [...], meta: { total, page, lastPage } }`.

### Get Service by ID
- **Method**: `GET`
- **Route**: `/services/:id`
- **Authentication**: None
- **Responses**: `200 OK`, `404 Not Found`.

### Update a Service
- **Method**: `PATCH`
- **Route**: `/services/:id`
- **Authentication**: Required (Bearer Token)
- **Request Body**: Accepts partial updates (e.g., `{ "price": 109.99 }`).
- **Responses**: `200 OK`, `404 Not Found`.

### Delete a Service
- **Method**: `DELETE`
- **Route**: `/services/:id`
- **Authentication**: Required (Bearer Token)
- **Description**: Hard deletion of the service. Fails if active bookings rely on it.
- **Responses**: `200 OK`, `404 Not Found`.

---

## 4. Bookings Module

### Create a Booking
- **Method**: `POST`
- **Route**: `/bookings`
- **Authentication**: None (Publicly bookable)
- **Validation**: 
  - `bookingDate` must not be in the past.
  - Cannot double-book the same `serviceId`, `bookingDate`, and `bookingTime`.
- **Request Body**:
  ```json
  {
    "serviceId": "uuid-here",
    "customerName": "Jane Doe",
    "customerEmail": "jane@example.com",
    "customerPhone": "+1234567890",
    "bookingDate": "2026-10-15",
    "bookingTime": "14:30",
    "notes": "Please use eco-friendly products."
  }
  ```
- **Responses**: `201 Created`, `409 Conflict` (Double booking).

### Get All Bookings
- **Method**: `GET`
- **Route**: `/bookings`
- **Authentication**: Required (Bearer Token)
- **Query Parameters**:
  - `page` / `limit` (optional): Pagination.
  - `status` (optional): Filter by enum (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`).
  - `customerName` (optional): Partial search on customer name.
  - `serviceId` (optional): Filter bookings for a specific service.
- **Example Usage**: `GET /bookings?status=PENDING&customerName=Jane&limit=20`
- **Responses**: `200 OK` paginated list.

### Get Booking by ID
- **Method**: `GET`
- **Route**: `/bookings/:id`
- **Authentication**: Required (Bearer Token)
- **Responses**: `200 OK`, `404 Not Found`.

### Update Booking Status
- **Method**: `PATCH`
- **Route**: `/bookings/:id/status`
- **Authentication**: Required (Bearer Token)
- **Validation**: `status` must be a valid Enum. Enforces state machine (cannot update a `CANCELLED` booking).
- **Request Body**:
  ```json
  { "status": "CONFIRMED" }
  ```
- **Responses**: `200 OK`, `400 Bad Request` (Invalid state transition).

### Cancel a Booking
- **Method**: `PATCH`
- **Route**: `/bookings/:id/cancel`
- **Authentication**: Required (Bearer Token)
- **Description**: Syntactic sugar for updating status to `CANCELLED`.
- **Responses**: `200 OK`, `400 Bad Request` (Already cancelled).
