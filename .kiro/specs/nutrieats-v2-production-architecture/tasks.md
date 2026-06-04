# Implementation Plan: NutriEats V2 Production Architecture

## Overview

This plan migrates the existing Express.js + PostgreSQL monolith into a production-grade, cloud-native microservices platform. Fifteen phases progress from monorepo setup through full CI/CD and property-based test coverage. All services are TypeScript-based, matching the existing stack. Tasks build incrementally — no orphaned code is integrated until wired in the subsequent step.

## Tasks

- [ ] 0. Phase 0 — Monorepo Foundation & Shared Packages
  - [ ] 0.1 Initialise npm workspaces monorepo and shared TypeScript config
    - Create root `package.json` with `workspaces: ["packages/*", "services/*", "frontend"]`
    - Create `tsconfig.base.json` with strict settings for all packages
    - Create `.sops.yaml` pointing at the KMS key ARN/resource
    - Create `packages/` and `services/` directory skeletons
    - _Requirements: 1.1, 6.1_

  - [ ] 0.2 Implement `packages/types` — shared TypeScript event schemas and domain types
    - Export `KafkaEventEnvelope<T>`, `OrderPlacedPayload`, `OrderDeliveredPayload`, `DeliveryAssignedPayload`
    - Export `FlashDealExpiryMessage`, `NotificationTask`
    - Export `OrderStatus` enum with all valid members (`PLACED | CONFIRMED | PREPARING | OUT_FOR_DELIVERY | DELIVERED | CANCELLED`)
    - Export `DeliveryStatus` enum
    - _Requirements: 1.1, 3.1, 3.2_

  - [ ] 0.3 Implement `packages/observability` — OTel init, structured logger, and custom metrics
    - Write `initTelemetry(serviceName, serviceVersion)` using `@opentelemetry/sdk-node` with OTLP gRPC exporter and Prometheus exporter on port 9464
    - Write `createLogger(service)` using `pino` injecting active `traceId` and `spanId` from OTel context
    - Export `httpRequestCount`, `httpRequestDuration`, `kafkaConsumerLag`, `rabbitmqQueueDepth`, `redisCommandDuration` metrics
    - _Requirements: 10.1, 11.1, 12.1_

  - [ ]* 0.4 Write property test for structured log field completeness
    - **Property 7: Structured Log Field Completeness**
    - **Validates: Requirements 12.1**
    - Use `fast-check` to generate arbitrary log payloads; assert all required fields present and `timestamp` is valid ISO 8601

  - [ ] 0.5 Implement `packages/kafka-client` — typed producer/consumer wrappers with retry and DLQ routing
    - Write `consumeWithRetry<T>(consumer, dlqProducer, topic, handler, maxRetries=3)` matching the design
    - Export `createProducer(brokers)` and `createConsumer(brokers, groupId)` factory functions
    - Implement header-based retry counting and DLQ routing with structured error logging
    - _Requirements: 3.5, 3.6_

  - [ ] 0.6 Implement `packages/rabbitmq-client` — typed AMQP producer/consumer wrappers
    - Write `createRabbitMQChannel(connectionUrl)` with automatic reconnect
    - Export `publishToExchange(channel, exchange, routingKey, payload, headers)` typed helper
    - Export `consumeQueue(channel, queue, handler, maxRetries=3)` with DLX routing on exhausted retries
    - _Requirements: 4.1, 4.4_

  - [ ] 0.7 Implement `packages/redis-client` — cache-aside wrapper
    - Implement `CacheAsideService` class with `get<T>(key, fallback, ttlSeconds)` and `invalidate(keys[])` methods
    - Implement Redis-unavailability fallback: catch connection errors, log warning, call `fallback()` directly
    - _Requirements: 5.7, 5.8_

  - [ ]* 0.8 Write property test for Redis cache key contract
    - **Property 6: Redis Cache Key Contract**
    - **Validates: Requirements 5.2, 5.3, 5.5, 5.6**
    - Use `fast-check` to generate arbitrary IDs; assert resulting keys match namespace patterns and TTLs ≤ specified maxima

  - [ ] 0.9 Implement `packages/auth-middleware` — shared JWT validation middleware
    - Write Express middleware that validates RS256-signed JWTs from `Authorization: Bearer` header
    - Return HTTP 401 for absent, expired, malformed, or wrong-key tokens
    - Export `requireRole(role)` middleware for MERCHANT and RIDER role checks
    - _Requirements: 2.2, 9.2_

  - [ ]* 0.10 Write property test for unauthenticated request rejection
    - **Property 11: Unauthenticated Request Rejection**
    - **Validates: Requirements 2.2**
    - Use `fast-check` to generate arbitrary tokens (absent, expired, malformed, wrong key); assert all receive HTTP 401

- [ ] 1. Phase 1 — Containerization & Local Dev Environment
  - [ ] 1.1 Write multi-stage production Dockerfile for each of the seven services
    - Each Dockerfile: `node:22-alpine` build stage → minimal `node:22-alpine` runtime stage
    - Set `USER node` in the final stage (non-root)
    - Pin base image to specific digest in each Dockerfile
    - Services: `api-gateway`, `auth-service`, `user-health-service`, `catalog-service`, `order-service`, `delivery-service`, `notification-service`
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ] 1.2 Write `docker-compose.yml` at repository root for local development
    - Include all seven service containers with `build:` context and `depends_on` health checks
    - Include PostgreSQL containers (one per service database): `auth_db`, `userhealth_db`, `catalog_db`, `orders_db`, `delivery_db`
    - Include Redis (3-node cluster simulation), Kafka + Zookeeper, RabbitMQ
    - Set per-container memory limits of 512 MiB and CPU limits of 1 core
    - _Requirements: 6.4, 6.5, 6.6_

  - [ ] 1.3 Implement `GET /health/live` and `GET /health/ready` endpoint scaffold for all services
    - Create a shared `createHealthRouter(deps)` factory in `packages/observability` that accepts a `deps` object with `db`, `redis`, `kafka`, `rabbitmq` connection checkers
    - `/health/live` returns 200 while process is running, 503 in terminal error
    - `/health/ready` returns 200 only when all deps report connected; 503 otherwise
    - _Requirements: 17.1, 17.2_

  - [ ] 1.4 Implement graceful shutdown handler for all services
    - On `SIGTERM`: stop accepting connections, drain in-flight requests within 30 s, flush pino logs, then `process.exit(0)`
    - Configure `server.keepAliveTimeout` and `server.headersTimeout` appropriately
    - _Requirements: 17.3, 17.4_

- [ ] 2. Phase 2 — Auth Service Extraction
  - [ ] 2.1 Create `services/auth-service` project with Prisma schema for `auth_db`
    - Copy Prisma schema for `auth_users` and `refresh_tokens` tables from design
    - Run `prisma migrate dev --name init` for auth_db
    - Export Prisma client wrapper: `import { PrismaClient } from '@prisma/client'; export const db = new PrismaClient();`
    - _Requirements: 1.3, 14.1_

  - [ ] 2.2 Implement `POST /api/auth/register` and `POST /api/auth/login` endpoints
    - `register`: validate payload with `zod`, hash password with `bcryptjs`, insert into `auth_users`, return JWT
    - `login`: look up user by email, validate password, issue access token (RS256, TTL 900s) and refresh token (TTL 2592000s), store refresh token hash in Redis
    - Emit OTel trace spans for each endpoint
    - _Requirements: 1.3, 9.2_

  - [ ]* 2.3 Write property test for JWT payload correctness
    - **Property 1: JWT Payload Correctness**
    - **Validates: Requirements 9.2, 15.2**
    - Use `fast-check` to generate arbitrary user IDs and roles; issue JWT, decode, assert `sub` matches, `exp - iat === 900`, algorithm is RS256

  - [ ] 2.4 Implement `POST /api/auth/refresh` and `POST /api/auth/logout` endpoints
    - `refresh`: validate refresh token from request body, look up Redis entry, if not revoked issue new access token and rotate refresh token with new Redis entry
    - `logout`: mark refresh token as revoked in Redis immediately
    - _Requirements: 1.3, 5.1_

  - [ ] 2.5 Implement Redis-backed brute force protection for login endpoint
    - On failed login attempt, increment `session:blocklist:{ip}` in Redis with 60s TTL
    - If count >= 5, set key to `blocked` with 300s TTL and return HTTP 429
    - Emit structured security-alert log entry on block
    - _Requirements: 9.8_

  - [ ] 2.6 Wire Auth Service into `docker-compose.yml` with `auth_db` PostgreSQL container
    - Configure environment variables: `DATABASE_URL`, `REDIS_URL`, `JWT_PRIVATE_KEY` (mounted from `.env.local`)
    - Add health check for `/health/ready`
    - _Requirements: 6.4_

- [ ] 3. Phase 3 — Catalog Service Extraction
  - [ ] 3.1 Create `services/catalog-service` project with Prisma schema for `catalog_db`
    - Copy `restaurants` and `menu_items` tables from design
    - Run `prisma migrate dev --name init` for catalog_db
    - Export Prisma client
    - _Requirements: 1.5, 14.1_

  - [ ] 3.2 Implement Health Score calculation logic
    - Write `calculateHealthScore(calories, protein, fat, fiber, cookingMethod)` function matching the formula from the spec
    - Clamp output to `[0, 10]`
    - _Requirements: 1.5_

  - [ ]* 3.3 Write property test for Health Score bounded output
    - **Property 2: Health Score Bounded Output**
    - **Validates: Requirements 15.3**
    - Use `fast-check` to generate arbitrary inputs `calories ∈ [0, 10000]`, `protein ∈ [0, 500]`, `fat ∈ [0, 500]`, `fiber ∈ [0, 500]`; assert output always in `[0, 10]` and finite

  - [ ] 3.3 Implement Catalog Service REST endpoints
    - `GET /api/restaurants` — list all open restaurants, cache result in Redis `catalog:restaurants:all` with TTL 300s
    - `GET /api/restaurants/:id` — single restaurant with menu items
    - `GET /api/menu-items/:id` — full item detail, cache in Redis `catalog:menu-item:{id}` with TTL 300s
    - `GET /api/deals` — items with active discount, sorted by discount %
    - `GET /api/offers/flash` — items where `flashDealUntil > now()`, sorted by expiry time
    - All GET endpoints use `CacheAsideService.get()` with fallback to DB
    - _Requirements: 1.5, 5.2, 5.3_

  - [ ] 3.4 Implement Catalog Service merchant endpoints
    - `GET /api/merchant/restaurant` — own restaurant details (role check: MERCHANT)
    - `POST /api/merchant/menu-items` — create item, auto-calculate Health Score server-side, invalidate cache
    - `PUT /api/merchant/menu-items/:id` — update item, recalculate Health Score, invalidate `catalog:menu-item:{id}` and `catalog:restaurants:all` within 1s
    - `PATCH /api/merchant/menu-items/:id/availability` — toggle `isAvailable`
    - _Requirements: 1.5, 5.4_

  - [ ] 3.5 Implement RabbitMQ producer for flash-deal expiry tasks
    - On flash deal creation, publish `FlashDealExpiryMessage` to `nutrieats.flash-deals` exchange with `x-delay` header set to `expiresAt - now()`
    - _Requirements: 4.2_

  - [ ] 3.6 Implement RabbitMQ consumer for flash-deal expiry processing
    - Consume from `flash-deal-expiry` queue
    - On message: set `menuItemId.flashDealUntil` to null, invalidate Redis cache entry within 2s
    - _Requirements: 4.3, 4.4_

  - [ ] 3.7 Wire Catalog Service into `docker-compose.yml` with `catalog_db` PostgreSQL container
    - Configure environment: `DATABASE_URL`, `REDIS_URL`, `RABBITMQ_URL`
    - _Requirements: 6.4_

- [ ] 4. Phase 4 — User-Health Service Extraction
  - [ ] 4.1 Create `services/user-health-service` project with Prisma schema for `userhealth_db`
    - Copy `users`, `body_stats`, `allergies`, `notif_prefs`, `daily_logs` tables from design
    - Run `prisma migrate dev --name init`
    - Export Prisma client
    - _Requirements: 1.4, 14.1_

  - [ ] 4.2 Implement BMR calculation logic
    - Write `calculateBMR(age, weightKg, heightCm, gender)` using Mifflin-St Jeor formula
    - Write `calculateRDA(bmr, activityLevel)` to derive default nutrient targets
    - _Requirements: 1.4_

  - [ ]* 4.3 Write property test for BMR positivity invariant
    - **Property 4: BMR Positivity Invariant**
    - **Validates: Requirements 15.5**
    - Use `fast-check` to generate arbitrary `age ∈ [1, 120]`, `weightKg ∈ [1, 500]`, `heightCm ∈ [50, 300]`, `gender ∈ ['male', 'female']`; assert BMR is positive and finite

  - [ ] 4.4 Implement User-Health Service REST endpoints
    - `GET /api/users/profile` — user + body stats + allergies (auth required)
    - `POST /api/users/body-stats` — save age, weight, height, gender, activity level; calculate BMR and RDA, store in `body_stats`
    - `GET /api/users/daily-log` — return today's consumed nutrients vs RDA, cache in Redis `health:daily-log:{userId}:{date}` with TTL 60s
    - `GET /api/users/rda` — return current RDA targets, cache in Redis `health:rda:{userId}` with TTL 300s
    - `PUT /api/users/rda` — manual override of RDA targets, invalidate Redis cache entry immediately
    - `GET/POST /api/users/allergies` — allergy add/remove, invalidate `health:allergies:{userId}` cache entry
    - _Requirements: 1.4, 5.5, 5.6_

  - [ ] 4.5 Implement Kafka `order.delivered` consumer to update DailyLog
    - Consume from `order.delivered` topic, consumer group `user-health-service`
    - On event: parse `OrderDeliveredPayload`, sum `caloriesSnapshot` from all items, update or create `DailyLog` entry for the customer within 5s
    - Invalidate `health:daily-log:{userId}:{date}` cache entry
    - _Requirements: 3.3_

  - [ ]* 4.6 Write property test for DailyLog calorie accumulation correctness
    - **Property 5: DailyLog Calorie Accumulation Correctness**
    - **Validates: Requirements 3.3, 15.6**
    - Use `fast-check` to generate arbitrary sets of `caloriesSnapshot` values; assert sum equals `caloriesConsumed` and is never negative or NaN

  - [ ] 4.7 Wire User-Health Service into `docker-compose.yml` with `userhealth_db` PostgreSQL container
    - Configure environment: `DATABASE_URL`, `REDIS_URL`, `KAFKA_BROKERS`
    - _Requirements: 6.4_

- [ ] 5. Phase 5 — Order Service Extraction
  - [ ] 5.1 Create `services/order-service` project with Prisma schema for `orders_db`
    - Copy `orders` and `order_items` tables (including `version` column for optimistic locking) from design
    - Run `prisma migrate dev --name init`
    - Export Prisma client
    - _Requirements: 1.6, 14.1_

  - [ ] 5.2 Implement Order state machine with optimistic locking
    - Define valid transition graph: `PLACED → CONFIRMED → PREPARING → OUT_FOR_DELIVERY → DELIVERED`, and `PLACED|CONFIRMED|PREPARING → CANCELLED`
    - Write `transitionOrder(orderId, newStatus, currentVersion)` that uses a conditional `UPDATE orders SET status = $1, version = version + 1 WHERE id = $2 AND version = $3`
    - If `rowsAffected === 0`, return HTTP 409 (conflict); if transition is illegal, return HTTP 422
    - _Requirements: 8.2, 15.4_

  - [ ]* 5.3 Write property test for Order Status transition validity
    - **Property 3: Order Status Transition Validity**
    - **Validates: Requirements 8.2, 15.4**
    - Use `fast-check` to generate arbitrary valid transition sequences; assert final status is always a valid `OrderStatus` member
    - Use `fast-check` to generate illegal transition pairs; assert each returns HTTP 422 without mutating stored order

  - [ ] 5.4 Implement Order Service REST endpoints
    - `POST /api/orders` — validate payload, create order + order items with price and calorie snapshots, call `transitionOrder` to initial PLACED status
    - `GET /api/orders/:id` — return order detail
    - `GET /api/orders/my` — return customer order history
    - `PATCH /api/orders/:id/status` — invoke state machine, emit Kafka event on success
    - _Requirements: 1.6_

  - [ ] 5.5 Implement Kafka producer for Order lifecycle events
    - On each status transition: publish `KafkaEventEnvelope<OrderPlacedPayload|...>` to `order.{status}` topic keyed by `orderId`
    - Include `traceId` and `spanId` from active OTel context
    - _Requirements: 3.1_

  - [ ]* 5.6 Write property test for Kafka event publishing on status transition
    - **Property 8: Kafka Event Publishing on Status Transition**
    - **Validates: Requirements 3.1**
    - Use `fast-check` to generate valid transition inputs; assert exactly one Kafka message published to `order.{status}` topic; payload includes `orderId`, `customerId`, `occurredAt`; message key equals `orderId`

  - [ ] 5.7 Wire Order Service into `docker-compose.yml` with `orders_db` PostgreSQL container
    - Configure environment: `DATABASE_URL`, `KAFKA_BROKERS`
    - _Requirements: 6.4_

  - [ ] 5.8 Checkpoint — Phase 5 integration
    - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Phase 6 — Delivery Service Extraction
  - [ ] 6.1 Create `services/delivery-service` project with Prisma schema for `delivery_db`
    - Copy `delivery_assignments` and `rider_locations` tables from design
    - Run `prisma migrate dev --name init`
    - Export Prisma client
    - _Requirements: 1.7, 14.1_

  - [ ] 6.2 Implement Delivery Service REST endpoints
    - `GET /api/rider/assignments/pending` — orders awaiting pickup (role: RIDER)
    - `POST /api/rider/assignments/:orderId/accept` — create `DeliveryAssignment` record
    - `PATCH /api/rider/assignments/:id/status` — update status to `PICKED_UP | ON_THE_WAY | DELIVERED`, emit Kafka event on each transition
    - `GET /api/rider/assignments/active` — current active delivery for requesting rider
    - `POST /api/rider/location` — insert rider location into `rider_locations`
    - _Requirements: 1.7_

  - [ ] 6.3 Implement Kafka producer for Delivery lifecycle events
    - On each delivery status transition: publish `KafkaEventEnvelope<DeliveryAssignedPayload|...>` to `delivery.{status}` topic keyed by `orderId`
    - _Requirements: 3.2_

  - [ ] 6.4 Wire Delivery Service into `docker-compose.yml` with `delivery_db` PostgreSQL container
    - Configure environment: `DATABASE_URL`, `KAFKA_BROKERS`
    - _Requirements: 6.4_

- [ ] 7. Phase 7 — Notification Service + Messaging Layer
  - [ ] 7.1 Create `services/notification-service` project structure (no REST, consumers only)
    - Set up `src/consumers/` for Kafka and RabbitMQ consumers
    - Set up `src/dispatchers/` with stubs for email, push, and in-app dispatch functions
    - _Requirements: 1.8_

  - [ ] 7.2 Implement Kafka consumers for `order.*` and `delivery.*` topics
    - Subscribe to all `order.*` and `delivery.*` topics in consumer group `notification-service`
    - Map each event type to a notification template and call appropriate dispatcher
    - Use `consumeWithRetry` from `packages/kafka-client` with DLQ routing after 3 failures
    - _Requirements: 3.4_

  - [ ] 7.3 Implement RabbitMQ consumer for `notifications` queue
    - Consume `NotificationTask` messages; call email/push/in-app dispatcher based on `channel` field
    - On failure: rely on DLX routing to `notifications.dlx` queue after 3 delivery attempts
    - _Requirements: 4.1_

  - [ ]* 7.4 Write property test for dead-letter queue routing after exhausted retries
    - **Property 9: Dead-Letter Queue Routing After Exhausted Retries**
    - **Validates: Requirements 3.6, 4.4**
    - Mock consumer handler to always throw; assert message appears in `.dlq` / `.dlx` after exactly 3 failed attempts and is not re-delivered to original queue

  - [ ] 7.5 Initialize Kafka topic topology on service startup
    - Create an `initKafkaTopics()` function that creates all `order.*`, `delivery.*`, and `*.dlq` topics with replication factor 3, min ISR 2, and 7-day retention
    - Call from `notification-service` and the Kafka init Job in Helm
    - _Requirements: 3.5, 3.7_

  - [ ] 7.6 Initialize RabbitMQ exchange/queue topology on service startup
    - Create `initRabbitMQTopology()` function that declares all exchanges, quorum queues, DLX, and bindings as documented in the design
    - Call from `notification-service` and `catalog-service` on startup
    - _Requirements: 4.4, 4.5_

  - [ ] 7.7 Wire Notification Service into `docker-compose.yml`
    - Configure environment: `KAFKA_BROKERS`, `RABBITMQ_URL`
    - _Requirements: 6.4_

  - [ ] 7.8 Checkpoint — Messaging layer integration
    - Ensure all tests pass, ask the user if questions arise.
