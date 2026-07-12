# Architecture Decision Records (ADRs)

This document outlines the core technical decisions and trade-offs made during the development of the EN2H Booking Platform.

## 1. Framework: NestJS
- **Decision**: Use NestJS over raw Express.js.
- **Reasoning**: NestJS enforces a highly opinionated, modular architecture heavily inspired by Angular. It provides out-of-the-box Dependency Injection, TypeScript support, decorators, and a standardized ecosystem.
- **Trade-offs**: Steeper learning curve and slightly heavier bootstrap time compared to raw Express.
- **Alternatives Considered**: Raw Express.js (too unopinionated, leads to spaghetti code at scale).

## 2. ORM & Database: Prisma & PostgreSQL
- **Decision**: Use PostgreSQL managed via Prisma ORM.
- **Reasoning**: PostgreSQL is the industry gold standard for ACID-compliant relational data. Prisma provides unmatched end-to-end type safety, generating fully typed queries based directly on the schema. Its declarative migrations prevent drift between application code and database state.
- **Trade-offs**: Prisma is heavier than raw SQL query builders and abstracts away some complex SQL optimizations.
- **Alternatives Considered**: TypeORM (historically plagued by complex caching bugs and verbose entity definitions).

## 3. Authentication: JWT & Hashed Refresh Tokens
- **Decision**: Implement stateless JWT access tokens with stateful, bcrypt-hashed refresh tokens.
- **Reasoning**: Stateless JWTs (`15m` lifespan) keep the API fast and horizontally scalable without database lookups on every request. Refresh tokens (`7d` lifespan) allow persistent sessions. Hashing the refresh token in the database ensures that a database breach does not immediately compromise user sessions.
- **Trade-offs**: Did not implement strict "Token Family" rotation chains (which detect concurrent token reuse indicating theft). 
- **Alternative Considered**: Full Token Family tracking. *Rejected* as an over-engineering trade-off; hashed refresh tokens provide extremely strong security proportional to the assessment's scope without introducing massive table bloat and rotation chain logic.

## 4. Feature Modules
- **Decision**: Group code vertically by feature (`AuthModule`, `BookingsModule`) rather than horizontally (`controllers/`, `services/`).
- **Reasoning**: Maximizes cohesion. When an engineer works on Bookings, all related files are in one directory. It also paves the path for seamlessly breaking modules into Microservices later.

## 5. Global Exception Filter & Interceptor
- **Decision**: Implement a global `ApiResponseInterceptor` and `HttpExceptionFilter`.
- **Reasoning**: Ensures 100% of API responses follow a strict `{ success, message, data }` or `{ success, error, statusCode }` envelope. Prevents individual controllers from inconsistently formatting payloads.

## 6. Swagger Auto-Documentation
- **Decision**: Utilize `@nestjs/swagger`.
- **Reasoning**: Keeps API documentation perfectly synchronized with the source code via DTO decorators. Eliminates the risk of stale API docs.

## 7. Containerization: Docker & Compose
- **Decision**: Provide a `docker-compose.yml` and `Dockerfile`.
- **Reasoning**: Guarantees the "it works on my machine" promise. Reviewers can spin up the Node.js API and PostgreSQL database simultaneously with a single `docker compose up --build` command, requiring zero local dependency configuration.

## 8. CI/CD: GitHub Actions
- **Decision**: Add a `.github/workflows/ci.yml` pipeline.
- **Reasoning**: Enforces quality by blocking broken pull requests. Automatically runs `npm ci`, `prisma generate`, `npm run build`, and `npm run test:cov` on every push.

## 9. Path Aliases
- **Decision**: Configure TypeScript aliases (`@common/*`, `@database/*`).
- **Reasoning**: Eliminates fragile relative imports (e.g., `../../../common/utils`). Note: Required custom Jest `moduleNameMapper` configurations to execute unit tests successfully.

## 10. Request Validation: ValidationPipe
- **Decision**: Bind a global `ValidationPipe` with `whitelist: true`.
- **Reasoning**: Strips out any malicious or unexpected JSON properties sent by clients before they ever reach the controller logic, preventing prototype pollution and mass assignment vulnerabilities.
