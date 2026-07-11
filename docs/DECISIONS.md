# Architectural Decision Records (ADR)

This document tracks the important architectural decisions made during the development of the EN2H Booking Platform.

## 1. Feature-Based Modular Architecture (DDD)
**Context**: Structuring a NestJS application can be done by layer (controllers, services, repositories) or by feature (modules containing everything related to a specific domain).
**Decision**: We chose a feature-based modular architecture (Domain-Driven Design).
**Consequences**: The application is highly cohesive. The `Auth`, `Users`, `Services`, and `Bookings` domains are encapsulated. This makes the codebase easier to scale, test, and potentially split into microservices in the future.

## 2. PostgreSQL + Prisma ORM
**Context**: We needed a relational database and a way to interact with it safely in TypeScript.
**Decision**: We selected PostgreSQL for robust ACID compliance and relational integrity. We selected Prisma as the ORM.
**Consequences**: Prisma provides absolute type safety from the database to the API boundaries. Schema migrations are declarative, and the auto-generated Prisma Client eliminates the risk of SQL injection or runtime type mismatches.

## 3. JWT Authentication with Passport
**Context**: We need a stateless mechanism to authenticate and authorize users securely.
**Decision**: We implemented JWT (JSON Web Tokens) using the `@nestjs/passport` strategy.
**Consequences**: The backend remains stateless and highly scalable. Using Passport allows us to easily extend authentication methods (e.g., OAuth2, Magic Links) in the future without major architectural rewrites.

## 4. Centralized Config and Validation
**Context**: Applications often suffer from `process.env` scattered throughout the codebase, leading to undefined runtime errors.
**Decision**: We strictly enforce the use of `@nestjs/config` with Joi validation (`env-validation.ts`).
**Consequences**: The application will fail to boot instantly if required environment variables are missing or incorrectly typed, completely eliminating "silent" environment-related bugs in production.

## 5. Booking Status State Machine
**Context**: Booking statuses (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`) have strict lifecycle rules.
**Decision**: Rather than scattering `if (status === X)` checks in the service logic, we extracted this into a centralized `BookingStatusValidator`.
**Consequences**: We protected critical business invariants. Illegal state transitions are rejected globally, reducing cognitive load on the service layer and preventing invalid domain states from ever reaching the database.
