# Development Log

A chronological evolution of the EN2H Booking Platform backend.

## Milestone 1: Infrastructure & Scaffolding
- Initialized a strict NestJS repository architecture.
- Established the `src/modules`, `src/common`, and `src/config` layouts.
- Integrated Prisma ORM with PostgreSQL.
- Implemented global `ValidationPipe`, `ApiResponseInterceptor`, and `HttpExceptionFilter` to enforce strict input sanitization and standardized JSON outputs.
- Setup Swagger UI auto-documentation.

## Milestone 2: Authentication (Phase 1)
- Scaffolded the `AuthModule` and `UsersModule`.
- Created the Prisma `User` model.
- Implemented `bcrypt` password hashing for secure registration.
- Established the core JWT issuance pipeline upon successful login.

## Milestone 3: Services Catalog
- Designed the `Service` Prisma model.
- Implemented RESTful CRUD operations (`POST`, `GET`, `PATCH`, `DELETE`).
- Developed advanced querying logic including text-based search (`?search=`), filtering (`?active=`), and offset pagination (`?page=1&limit=10`).
- Secured modification endpoints using JWT Guards.

## Milestone 4: Core Bookings Engine
- Created the `Booking` Prisma model.
- Established a strictly-enforced `BookingStatus` state machine (`PENDING` -> `CONFIRMED` -> `COMPLETED`/`CANCELLED`).
- Enforced complex business logic: preventing past-date bookings, blocking double-bookings via composite unique keys, and halting arbitrary state transitions.
- Hooked up relational queries to retrieve Bookings attached to specific Services.

## Milestone 5: Production Readiness
- Containerized the API and PostgreSQL database utilizing `Dockerfile` and `docker-compose.yml`.
- Replaced fragile relative paths with TypeScript path aliases (`@common`, `@database`).
- Audited environments for zero hardcoded secrets.

## Milestone 6: Enterprise Authentication (Phase 2)
- Upgraded the Authentication module to support strict Token Rotation.
- Implemented persistent Session Management via bcrypt-hashed Refresh Tokens stored in the database.
- Created `/auth/refresh` to issue new token pairs and `/auth/logout` to instantly revoke access securely.

## Milestone 7: Unit Testing & CI/CD
- Refactored `package.json` to map `@database` paths for Jest.
- Authored comprehensive, isolated Jest unit tests mocking `PrismaService` and `JwtService`.
- Reached near 100% statement coverage across core domains (`AuthService`, `ServicesService`, `BookingsService`).
- Wired up GitHub Actions (`ci.yml`) to enforce build success and test coverage on every push to `dev` and `main`.
- Generated automated Postman collection scripts for 1-click reviewer testing.
