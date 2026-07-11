# Database Design

## Core Entities

User -> Service -> Booking

## Suggested Tables

### users

- id
- name
- email
- passwordHash
- role
- createdAt
- updatedAt

### services

- id
- title
- description
- price
- durationMinutes
- isActive
- createdAt
- updatedAt

### bookings

- id
- userId
- serviceId
- bookingDate
- bookingTime
- status
- notes
- createdAt
- updatedAt

## Relationships

- A user can have many bookings
- A service can have many bookings
- A booking belongs to one user and one service

## Constraints

- Email must be unique
- Booking date cannot be in the past
- Completed bookings should not revert to invalid states
- Inactive services cannot receive new bookings

## Indexing Notes

- Index foreign keys used by booking lookups
- Index email for login queries
- Index booking date and status for listing and filtering
