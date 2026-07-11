# Business Rules

## Booking Rules

- Booking date cannot be in the past
- Booking must reference an existing service
- Booking must reference an existing user
- Duplicate booking for the same service, date, and time must be rejected
- Inactive services cannot receive bookings

## Status Rules

- Pending bookings can move forward through valid states
- Cancelled bookings cannot become completed
- Completed bookings should not be edited into invalid states

## Service Rules

- Services can be active or inactive
- Inactive services are hidden from new booking flows
- Service price and duration should be validated as positive values
