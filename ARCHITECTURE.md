# Architecture Overview

This document outlines the high-level architecture, module boundaries, and design principles of the EN2H Booking Platform API. The system is built using **NestJS**, adhering to strict Domain-Driven Design (DDD) principles and feature-based modularity, backed by **PostgreSQL** and **Prisma ORM**.

---

## High-Level Design

The application follows a classic layered architecture pattern optimized for NestJS. External HTTP requests are caught by global interceptors/filters, routed to domain-specific controllers, delegated to business-logic services, and finally persisted via the Prisma data access layer.

```mermaid
flowchart TD
    Client[Client (Frontend / Mobile)]
    
    subgraph NestJS Application
        Interceptor[Global Interceptor & Filter]
        Controller[Controller Layer]
        Service[Service Layer (Business Logic)]
        Prisma[Prisma Data Access Layer]
    end
    
    Database[(PostgreSQL Database)]

    Client -->|HTTP Request| Interceptor
    Interceptor --> Controller
    Controller --> Service
    Service --> Prisma
    Prisma --> Database
    Database --> Prisma
    Prisma --> Service
    Service --> Controller
    Controller --> Interceptor
    Interceptor -->|HTTP Response| Client
```

---

## Folder Structure

The repository is structured to prioritize scalability, readability, and clear separation of concerns.

```text
src/
├── common/        # Application-wide utilities (Guards, Interceptors, Filters)
├── config/        # Environment-aware configuration files & Joi validation schemas
├── database/      # Prisma Service encapsulation and DB connection management
├── modules/       # Feature-based domain modules (The core of the app)
│   ├── auth/      # Authentication & Token Management
│   ├── users/     # User identity and profile management
│   ├── services/  # Booking services catalog management
│   ├── bookings/  # Core booking engine and state machines
│   └── health/    # Kubernetes/Docker liveness probes
├── main.ts        # Application bootstrap & global bindings
└── app.module.ts  # Root module aggregating all feature modules
```

---

## Module Responsibilities

The application is decomposed into tightly cohesive, loosely coupled feature modules:

### Authentication (`src/modules/auth`)
- **Responsibility**: Issues and validates JSON Web Tokens (JWT).
- **Features**: Registration, Login, Refresh Token Rotation, and Logout.
- **Security**: Utilizes bcrypt to securely hash passwords and refresh tokens at rest. Integrates tightly with `@nestjs/passport`.

### Users (`src/modules/users`)
- **Responsibility**: Manages the `User` entity lifecycle.
- **Features**: Creating identities, retrieving user profiles by ID/Email, and securely persisting hashed refresh tokens during auth flows.

### Services (`src/modules/services`)
- **Responsibility**: Manages the catalog of bookable services (e.g., Car Wash, Consulting).
- **Features**: Full CRUD operations. Enforces strict uniqueness on service titles. Implements cursor/offset pagination and text-based searching.

### Bookings (`src/modules/bookings`)
- **Responsibility**: The core domain engine managing customer reservations.
- **Features**: Idempotent booking creation (preventing double-bookings via composite unique keys `[serviceId, bookingDate, bookingTime]`). Enforces strict state machine transitions (e.g., `PENDING -> CONFIRMED`, blocking `COMPLETED -> CANCELLED`).

### Health (`src/modules/health`)
- **Responsibility**: Provides lightweight endpoints for container orchestrators (Docker/Kubernetes) to verify that the HTTP server and database connections are alive.

---

## Shared Components

### Config (`src/config`)
Centralizes environment variables into strongly-typed objects. Uses `Joi` to perform strict schema validation at startup (e.g., crashing immediately if `JWT_SECRET` or `DATABASE_URL` is missing), adhering to the Fail-Fast principle.

### Common (`src/common`)
Houses domain-agnostic tools:
- **`ApiResponseInterceptor`**: Wraps all successful outgoing payloads in a standardized `{ success: true, message: string, data: T }` envelope.
- **`HttpExceptionFilter`**: Catches all thrown exceptions and standardizes the JSON error payload sent to the client.

### Database (`src/database`)
Encapsulates the generated Prisma Client inside an injectable `PrismaService`. This ensures the application maintains a single, optimized connection pool to PostgreSQL and correctly manages connection lifecycles during application shutdown (`onModuleDestroy`).

---

## Dependency Injection

The application strictly utilizes NestJS's native IoC (Inversion of Control) container for Dependency Injection.
- **No Global Singletons**: Dependencies are never manually instantiated via `new Service()`.
- **Constructor Injection**: Every controller and service defines its dependencies in its constructor (e.g., `constructor(private readonly prisma: PrismaService) {}`), allowing the NestJS runtime to wire the graph.
- **Testability**: Because of strict DI, we easily substitute real services with mocked variants during our Jest unit test runs (e.g., providing a `mockPrismaService` instead of a real database connection).

---

## Request Lifecycle

When a client makes a request to the API, it follows a strict, predictable path:

1. **Middleware**: Executes underlying Express middleware (e.g., CORS, Body Parsing).
2. **Guards (`jwt-auth.guard.ts`)**: If the endpoint is protected, Passport validates the JWT. If invalid, it immediately rejects with HTTP 401.
3. **Pipes (ValidationPipe)**: The incoming JSON payload is transformed into a typed DTO class. `class-validator` decorators (e.g., `@IsString()`, `@Max(100)`) enforce schema rules. If validation fails, it rejects with HTTP 400.
4. **Controller**: The routed controller method receives the sanitized, validated DTO and immediately delegates it to the Service layer.
5. **Service**: Core business logic executes (e.g., checking if a booking date is in the past).
6. **Prisma**: The service reads/writes to PostgreSQL via `PrismaService`.
7. **Interceptor (`api-response.interceptor.ts`)**: The raw object returned by the controller is intercepted and wrapped in the standardized API response envelope.
8. **Exception Filter**: If any error was thrown during steps 4-7 (e.g., `NotFoundException`), it bypasses the interceptor and is caught by the `HttpExceptionFilter` for clean formatting.

---

## Design Principles

### Feature-Based Architecture
The codebase is sliced vertically by feature rather than horizontally by type. For instance, `auth.controller`, `auth.service`, and `auth.module` are grouped together in `modules/auth`. This increases cohesiveness and makes it infinitely easier to extract features into microservices in the future.

### Separation of Concerns
- **Controllers**: Exclusively handle HTTP routing, DTO extraction, and Swagger documentation.
- **Services**: Exclusively handle business logic and database orchestration.

### Single Responsibility Principle (SRP)
Every class has exactly one reason to change. The `AuthService` manages tokens; the `UsersService` manages database records. The `AuthService` delegates to `UsersService` rather than speaking to Prisma directly.

### Configuration Management
Hardcoded configuration strings are banned. All variables (ports, secrets, database URLs) are loaded dynamically from the environment, validated on boot, and injected into services via the `@nestjs/config` module.
