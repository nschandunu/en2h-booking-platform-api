# Architecture

## Request Flow

Request -> Controller -> DTO Validation -> Service -> Prisma -> Database -> Response

## Core Principles

- Feature-based modules for clear boundaries
- Controllers stay thin and delegate business logic to services
- DTOs define request contracts and validation rules
- Prisma owns persistence concerns
- Shared utilities live in a common module only when reused across features

## NestJS Building Blocks

- Modules: group related controllers, services, and providers
- Dependency Injection: services are injected into controllers and other services
- Guards: protect routes such as authenticated booking actions
- Pipes: validate and transform request payloads
- Filters: standardize exception responses

## Response Style

- Use consistent HTTP status codes
- Return predictable JSON shapes
- Keep error responses centralized and readable
