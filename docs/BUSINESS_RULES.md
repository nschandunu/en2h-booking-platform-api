# Business Rules

This document outlines the strict domain logic and business rules enforced by the EN2H Booking Platform backend. These rules ensure data integrity, prevent invalid states, and secure the platform.

## 1. Booking Domain Rules

- **Past Bookings Rejected**: A customer cannot book a service for a date that has already passed. The system compares the requested `bookingDate` against the server's current date (stripping the time component).
- **Inactive Services**: A customer cannot book a service if its `isActive` flag is false.
- **Double-Booking Prevention**: Duplicate bookings are rejected at the database level. It is impossible to book the exact same `serviceId` on the exact same `bookingDate` at the exact same `bookingTime`. Attempting to do so yields a `409 Conflict`.
- **Service Existence**: A booking can only be created against a valid, existing `serviceId`.
- **State Machine Transitions**: A booking's status cannot be changed arbitrarily. The `BookingStatusValidator` enforces the following strict transitions:
  - `PENDING` -> `CONFIRMED` or `CANCELLED`
  - `CONFIRMED` -> `COMPLETED` or `CANCELLED`
  - `COMPLETED` -> (Terminal state, cannot be changed)
  - `CANCELLED` -> (Terminal state, cannot be changed)

## 2. Services Domain Rules

- **Unique Titles**: Service titles must be universally unique across the platform.
- **Positive Pricing**: The `price` of a service must be a valid, positive decimal value.
- **Duration**: The `duration` of a service must be a positive integer representing minutes.
- **Dependency Deletion**: A service cannot be hard-deleted if there are existing bookings associated with it (due to foreign key constraints). Administrators should mark it `isActive: false` instead.

## 3. Authentication & Security Rules

- **Password Policy**: Passwords must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special symbol.
- **Email Uniqueness**: User emails must be unique. Attempting to register an existing email yields a `409 Conflict`.
- **Password Storage**: Passwords are never stored in plaintext. They are hashed using `bcrypt`.
- **Refresh Token Storage**: Refresh tokens are treated like passwords. The server never stores plaintext refresh tokens; they are hashed via `bcrypt` upon generation and stored in the database.
- **Token Rotation**: The `/auth/refresh` endpoint requires a valid, unexpired refresh token. If successful, the server issues a brand-new access token and a brand-new refresh token, invalidating the old hash.
- **Access Token Lifespan**: Access tokens are short-lived (15 minutes) to minimize the attack window of a stolen token.
- **Secure Logout**: Hitting the `/auth/logout` endpoint instantly nullifies the user's stored refresh token hash, severing their ability to request new access tokens.

## 4. API & Validation Rules

- **Pagination Ceilings**: To prevent Out-Of-Memory (OOM) Denial of Service attacks, pagination `limit` parameters are strictly capped at a maximum of `100` items per request.
- **Global Payload Validation**: All incoming requests are strictly validated against their Data Transfer Objects (DTOs). Any unexpected fields are stripped (`whitelist: true`), and invalid payloads are rejected with HTTP 400 before hitting the controllers.
