# Requirements Document

## Introduction

NutriEats V2 transforms the existing Express.js + PostgreSQL monolith into a production-grade, cloud-native platform capable of handling millions of requests per second. The architecture decomposes the monolith into six domain-aligned microservices, introduces an event-driven backbone using Kafka and RabbitMQ, adds a multi-layer Redis caching strategy, and deploys all workloads on managed Kubernetes (EKS/GKE/AKS) via Helm charts. The system provides end-to-end observability (distributed tracing, metrics, structured logging), enforces zero-trust security between services via mTLS, and ships production-level CI/CD pipelines and property-based test coverage.

---

## Glossary

- **Auth Service**: Microservice responsible for user registration, login, JWT issuance, refresh-token rotation, and session management.
- **User-Health Service**: Microservice owning User, BodyStats, Allergy, NotifPrefs, and DailyLog domains.
- **Catalog Service**: Microservice owning Restaurant and MenuItem domains, including Health Score computation and deal/flash-offer management.
- **Order Service**: Microservice managing Order and OrderItem lifecycle from placement through cancellation.
- **Delivery Service**: Microservice managing DeliveryAssignment and rider location tracking.
- **Notification Service**: Microservice consuming events to deliver in-app, email, and push notifications.
- **API Gateway**: Edge component that routes, authenticates, and rate-limits all inbound client requests and implements the Backend-for-Frontend (BFF) pattern for the Next.js frontend.
- **Kafka**: Apache Kafka cluster used for high-throughput, durable event streaming across order lifecycle, delivery status, and daily-log update events.
- **RabbitMQ**: RabbitMQ broker used for task queues backing notifications, flash-deal expiry, and scheduled background tasks.
- **Redis**: Redis cluster used as a session store, catalog cache, and RDA/daily-log cache.
- **Helm**: Kubernetes package manager used to template and deploy all service workloads to managed Kubernetes clusters.
- **mTLS**: Mutual TLS — bidirectional certificate-based authentication between every pair of communicating microservices.
- **OpenTelemetry**: Vendor-neutral instrumentation SDK used to emit traces, metrics, and logs from all services.
- **Jaeger**: Distributed tracing backend that ingests OpenTelemetry trace data.
- **Prometheus**: Time-series metrics collection system that scrapes all service `/metrics` endpoints.
- **Grafana**: Metrics and log visualization platform connected to Prometheus and Loki.
- **Loki**: Log aggregation system that receives structured logs from all services.
- **EKS/GKE/AKS**: Managed Kubernetes offerings from AWS, Google Cloud, and Azure respectively.
- **HPA**: Horizontal Pod Autoscaler — Kubernetes controller that scales pod replicas based on observed resource metrics.
- **RDA**: Recommended Daily Allowance — per-nutrient daily intake targets calculated from a customer's BMR.
- **BMR**: Basal Metabolic Rate calculated using the Mifflin-St Jeor equation.
- **Health Score**: A 0–10 score computed per menu item from calorie, fat, fiber, protein, and cooking-method criteria.
- **PBT**: Property-Based Testing — an automated testing approach that generates arbitrary inputs to verify invariants.
- **SOPS**: Secrets OPerationS — tool for encrypting Kubernetes secrets committed to version control.

---

## Requirements

### Requirement 1: Microservices Decomposition

**User Story:** As a platform engineer, I want the NutriEats monolith decomposed into six domain-aligned microservices, so that each domain can be developed, deployed, and scaled independently.

#### Acceptance Criteria

1. THE System SHALL provide six independently deployable microservices: Auth Service, User-Health Service, Catalog Service, Order Service, Delivery Service, and Notification Service, each in its own container image.
2. WHEN a microservice is redeployed, THE System SHALL continue serving requests to all other microservices without downtime.
3. THE Auth Service SHALL own all JWT issuance, refresh-token rotation, and session-revocation logic extracted from the existing monolith `/api/auth` routes.
4. THE User-Health Service SHALL own all User, BodyStats, Allergy, NotifPrefs, and DailyLog data and expose the existing `/api/users` and `/api/users/daily-log` contract as REST endpoints.
5. THE Catalog Service SHALL own all Restaurant, MenuItem, Health Score computation, deals, and flash-offer logic extracted from the existing monolith `/api/restaurants`, `/api/menu-items`, `/api/deals`, and `/api/offers/flash` routes.
6. THE Order Service SHALL own Order and OrderItem lifecycle and expose the existing `/api/orders` contract as REST endpoints.
7. THE Delivery Service SHALL own DeliveryAssignment and rider-location tracking and expose the existing `/api/rider/assignments` contract as REST endpoints.
8. THE Notification Service SHALL consume domain events from Kafka and RabbitMQ to dispatch in-app, email, and push notifications without exposing a synchronous REST endpoint to other services.
9. WHEN migrating a domain from the monolith, THE System SHALL maintain backward compatibility with existing API contracts so that the Next.js frontend requires no URL changes.

---

### Requirement 2: API Gateway and BFF Layer

**User Story:** As a frontend engineer, I want a single ingress point that authenticates requests and composes data for the Next.js app, so that I do not call multiple microservice URLs from the browser.

#### Acceptance Criteria

1. THE API Gateway SHALL accept all inbound HTTP/HTTPS requests from the Next.js frontend and route them to the appropriate upstream microservice.
2. WHEN a request arrives at the API Gateway without a valid JWT, THE API Gateway SHALL return an HTTP 401 response before forwarding the request to any upstream service.
3. THE API Gateway SHALL enforce rate limiting of 1 000 requests per minute per authenticated user and 100 requests per minute per unauthenticated IP address.
4. IF the upstream microservice returns a 5xx response, THEN THE API Gateway SHALL return a structured error response to the client within 30 seconds and record the failure in the distributed trace.
5. THE API Gateway SHALL implement a Backend-for-Frontend aggregation endpoint for the home screen that composes data from the Catalog Service (deals, flash offers) and User-Health Service (daily-log, RDA hazard alerts) in a single HTTP response.
6. THE API Gateway SHALL propagate the OpenTelemetry trace context header to every upstream request so that end-to-end request traces are captured.
7. WHILE a service mesh is active, THE API Gateway SHALL terminate TLS from external clients and pass requests to upstream services over mTLS.

---

### Requirement 3: Event-Driven Architecture — Kafka Streaming

**User Story:** As a platform engineer, I want high-throughput domain events streamed through Kafka, so that order lifecycle, delivery status, and daily-log updates are decoupled and durable.

#### Acceptance Criteria

1. THE Order Service SHALL publish an `order.placed`, `order.confirmed`, `order.preparing`, `order.out_for_delivery`, `order.delivered`, and `order.cancelled` event to Kafka whenever the corresponding OrderStatus transition occurs.
2. THE Delivery Service SHALL publish a `delivery.assigned`, `delivery.picked_up`, `delivery.on_the_way`, and `delivery.delivered` event to Kafka whenever the corresponding DeliveryStatus transition occurs.
3. WHEN an `order.delivered` Kafka event is consumed by the User-Health Service, THE User-Health Service SHALL update the DailyLog for the ordering customer within 5 seconds of event receipt.
4. THE Notification Service SHALL consume all `order.*` and `delivery.*` Kafka topics to trigger user-facing status notifications.
5. THE System SHALL configure each Kafka topic with a replication factor of at least 3 and a minimum in-sync replicas value of 2, so that no event is lost during a single broker failure.
6. WHEN a Kafka consumer fails to process a message after 3 retry attempts, THE System SHALL move the message to a dedicated dead-letter topic named `{original-topic}.dlq` and emit a structured log entry with the message key and failure reason.
7. THE System SHALL retain Kafka messages on all topics for a minimum of 7 days.

---

### Requirement 4: Event-Driven Architecture — RabbitMQ Task Queues

**User Story:** As a platform engineer, I want task queues backed by RabbitMQ for notifications and scheduled jobs, so that these workloads are isolated from the high-throughput event stream.

#### Acceptance Criteria

1. THE Notification Service SHALL consume from a RabbitMQ `notifications` queue to process outbound email and push notification tasks.
2. THE Catalog Service SHALL publish flash-deal expiry tasks to a RabbitMQ `flash-deal-expiry` queue specifying the `menuItemId` and `expiresAt` timestamp.
3. WHEN a flash-deal expiry task is due, THE Catalog Service consumer SHALL set the corresponding MenuItem's `flashDealUntil` field to null and invalidate the Catalog Service Redis cache entry for that item within 2 seconds.
4. THE System SHALL configure all RabbitMQ queues with a dead-letter exchange so that messages exceeding 3 delivery attempts are routed to a corresponding `{queue-name}.dlx` exchange.
5. THE System SHALL deploy RabbitMQ in a clustered configuration with at least 2 nodes and quorum queues enabled for all application queues.
6. WHERE scheduled tasks are required (e.g., daily RDA summary emails), THE Notification Service SHALL use a RabbitMQ delayed-message plugin queue with the target delivery timestamp encoded in the message header.

---

### Requirement 5: Redis Caching Layer

**User Story:** As a platform engineer, I want a Redis caching layer for sessions, catalog data, and health data, so that database read pressure is reduced and response latency stays below 50 ms for cached paths.

#### Acceptance Criteria

1. THE Auth Service SHALL store active refresh tokens in Redis with a TTL equal to the token's expiry duration, and SHALL invalidate the Redis entry upon token revocation.
2. THE Catalog Service SHALL cache the full restaurant listing response in Redis with a key of `catalog:restaurants:all` and a TTL of 5 minutes.
3. THE Catalog Service SHALL cache individual MenuItem detail responses in Redis with a key pattern `catalog:menu-item:{id}` and a TTL of 5 minutes.
4. WHEN a merchant updates or creates a MenuItem, THE Catalog Service SHALL invalidate the affected `catalog:menu-item:{id}` cache key and the `catalog:restaurants:all` key within 1 second.
5. THE User-Health Service SHALL cache the DailyLog response for each user in Redis with a key pattern `health:daily-log:{userId}:{date}` and a TTL of 60 seconds.
6. THE User-Health Service SHALL cache the RDA targets for each user in Redis with a key pattern `health:rda:{userId}` and a TTL of 300 seconds, and SHALL invalidate the entry when the user updates body stats or RDA overrides.
7. THE System SHALL deploy Redis in a clustered configuration with at least 3 nodes and replication enabled, so that no cached data is lost during a single node failure.
8. IF a Redis node is unreachable, THEN THE System SHALL fall back to reading from the upstream database and SHALL NOT return an error to the calling service due to cache unavailability.

---

### Requirement 6: Containerization

**User Story:** As a platform engineer, I want every service containerized with Docker, so that the runtime environment is consistent across development, CI, and production.

#### Acceptance Criteria

1. THE System SHALL provide a production-grade `Dockerfile` for each of the six microservices and the API Gateway, using a multi-stage build that produces a final image based on a non-root, minimal base image (e.g., `node:22-alpine`).
2. THE System SHALL ensure that no container image runs as the `root` user in production.
3. THE System SHALL pin all base image tags to a specific digest in production Dockerfiles to prevent unexpected upstream changes.
4. THE System SHALL provide a `docker-compose.yml` at the repository root for local development that includes all six microservices, API Gateway, PostgreSQL instances, Redis cluster, Kafka, Zookeeper, and RabbitMQ.
5. WHEN the local `docker-compose up` command is executed, THE System SHALL start all services and pass health checks within 120 seconds.
6. THE System SHALL limit each service container's memory to 512 MiB and CPU to 1 core in the local `docker-compose.yml` to prevent resource exhaustion on developer machines.

---

### Requirement 7: Kubernetes Orchestration with Helm

**User Story:** As a platform engineer, I want all services deployed to managed Kubernetes via Helm charts, so that deployments are reproducible, versioned, and environment-parameterizable.

#### Acceptance Criteria

1. THE System SHALL provide a Helm chart for each microservice and the API Gateway in a `helm/` directory at the repository root, with configurable `values.yaml` files for `dev`, `staging`, and `production` environments.
2. THE System SHALL configure a Kubernetes Deployment for each microservice with a minimum of 2 pod replicas in production to ensure high availability.
3. THE System SHALL configure a HPA for each microservice targeting 70% average CPU utilization, scaling between a minimum of 2 and a maximum of 20 pod replicas.
4. THE System SHALL configure Kubernetes liveness and readiness probes for each service, with the readiness probe calling a `/health/ready` endpoint and the liveness probe calling a `/health/live` endpoint.
5. WHEN a rolling deployment is performed, THE System SHALL maintain a maximum unavailable pod count of 0 and a maximum surge of 1 pod so that the service remains available throughout the update.
6. THE System SHALL configure a PodDisruptionBudget for each microservice requiring at least 1 pod available at all times.
7. THE System SHALL store all Kubernetes Secrets in encrypted form using SOPS-encrypted values committed to the Helm chart repository, decrypted at deploy time via a CI/CD pipeline step.
8. THE System SHALL configure ResourceRequests and ResourceLimits for every container in production: CPU request 100 m, CPU limit 1 000 m, memory request 128 MiB, memory limit 512 MiB.
9. WHERE a managed Kubernetes cluster is available (EKS, GKE, or AKS), THE System SHALL use the cloud provider's managed node groups with automatic node provisioning enabled.

---

### Requirement 8: High Availability and Horizontal Scaling

**User Story:** As a product owner, I want the platform to handle millions of requests per second without single points of failure, so that the service remains available during traffic surges and individual component failures.

#### Acceptance Criteria

1. THE System SHALL ensure that no single microservice, database, cache, or broker is deployed as a single instance in production.
2. THE Order Service SHALL maintain order-state consistency by using optimistic locking on OrderStatus transitions so that concurrent status updates do not produce an invalid state.
3. THE Catalog Service SHALL serve restaurant and menu-item read requests with a p99 latency below 50 ms when the Redis cache is warm.
4. WHEN load on any microservice exceeds the HPA CPU threshold of 70%, THE System SHALL provision additional pod replicas within 60 seconds.
5. THE System SHALL configure PostgreSQL with at least one synchronous read replica per service database and route all read queries to read replicas via a connection pooler (e.g., PgBouncer).
6. IF the primary PostgreSQL node for any service database becomes unreachable, THEN THE System SHALL promote the synchronous replica to primary and restore read/write capability within 30 seconds via automated failover.
7. THE System SHALL configure inter-pod anti-affinity rules so that replicas of the same microservice are scheduled on different Kubernetes nodes.

---

### Requirement 9: Security Hardening

**User Story:** As a security engineer, I want all inter-service communication secured with mTLS, secrets managed centrally, and all ingress rate-limited, so that the attack surface is minimized and credentials are never exposed in plaintext.

#### Acceptance Criteria

1. THE System SHALL enforce mTLS between every pair of communicating microservices using a service mesh (e.g., Istio or Linkerd) with certificates rotated automatically every 24 hours.
2. THE Auth Service SHALL issue JWTs signed with RS256 (2048-bit RSA key minimum) with an access-token TTL of 15 minutes and a refresh-token TTL of 30 days.
3. THE System SHALL store all secrets (database passwords, JWT signing keys, Kafka credentials, Redis passwords) in a centralized secrets manager (e.g., AWS Secrets Manager, GCP Secret Manager, or HashiCorp Vault) and inject them into containers as environment variables at pod startup.
4. THE System SHALL rotate all service-to-service credentials automatically every 90 days without requiring a manual deployment.
5. THE API Gateway SHALL enforce an HTTP request body size limit of 1 MiB and reject requests exceeding this limit with an HTTP 413 response.
6. THE System SHALL enable Kubernetes NetworkPolicy for each namespace, blocking all ingress traffic not explicitly permitted by policy rules.
7. THE System SHALL run all container images through a vulnerability scanner (e.g., Trivy) in the CI pipeline and block promotion of images with critical-severity CVEs.
8. WHEN an authentication attempt fails 5 times within 60 seconds from the same IP address, THE Auth Service SHALL block further authentication requests from that IP for 300 seconds and emit a structured security-alert log entry.

---

### Requirement 10: Observability — Distributed Tracing

**User Story:** As a platform engineer, I want distributed traces across all microservices, so that I can diagnose latency and errors in multi-hop request flows.

#### Acceptance Criteria

1. THE System SHALL instrument every microservice and the API Gateway with the OpenTelemetry SDK, emitting spans for all inbound HTTP requests, outbound HTTP calls, Kafka produce/consume operations, RabbitMQ publish/consume operations, and Redis commands.
2. THE System SHALL export all trace data to Jaeger via the OpenTelemetry OTLP exporter.
3. WHEN a request spans multiple microservices, THE System SHALL propagate the W3C Trace-Context header so that all child spans appear under a single trace in Jaeger.
4. THE System SHALL sample 100% of traces in staging and a minimum of 10% of traces in production, with head-based sampling configurable per environment without a code change.
5. WHEN a request results in an HTTP 5xx response anywhere in the call chain, THE System SHALL mark the corresponding trace span with `error = true` and attach the error message as a span attribute.

---

### Requirement 11: Observability — Metrics

**User Story:** As a platform engineer, I want Prometheus metrics scraped from all services and visualized in Grafana, so that I can monitor service health and set alerts on SLOs.

#### Acceptance Criteria

1. THE System SHALL expose a `/metrics` endpoint on each microservice and the API Gateway in Prometheus exposition format, including default process and runtime metrics plus the following custom metrics: HTTP request count labeled by method, route, and status code; HTTP request duration histogram labeled by method and route; Kafka consumer lag per topic-partition; RabbitMQ queue depth per queue; and Redis command duration histogram.
2. THE System SHALL deploy a Prometheus instance configured to scrape all service `/metrics` endpoints at a 15-second interval.
3. THE System SHALL deploy Grafana with pre-built dashboards for each microservice showing request rate, error rate, and p99 latency (RED method), and a platform-level dashboard showing Kafka consumer lag, RabbitMQ queue depth, and Redis hit/miss ratio.
4. THE System SHALL configure Prometheus alerting rules that fire when the error rate for any microservice exceeds 1% over a 5-minute window, or when p99 latency exceeds 500 ms over a 5-minute window.
5. WHEN an alerting rule fires, THE System SHALL deliver an alert to a configured notification channel (e.g., Slack or PagerDuty) within 60 seconds.

---

### Requirement 12: Observability — Structured Logging

**User Story:** As a platform engineer, I want structured JSON logs from all services aggregated into a searchable log store, so that I can correlate logs with traces and investigate incidents quickly.

#### Acceptance Criteria

1. THE System SHALL configure every microservice to emit structured JSON logs to stdout, including the following fields: `timestamp` (ISO 8601), `level` (info / warn / error), `service`, `traceId`, `spanId`, `message`, and an optional `context` object.
2. THE System SHALL deploy a log aggregation pipeline that collects stdout logs from all Kubernetes pods and ships them to Loki (or an ELK stack), with retention configured for a minimum of 30 days.
3. THE System SHALL configure Grafana with a Loki datasource so that logs for any trace can be retrieved by `traceId` directly from the Grafana Explore view.
4. WHEN a microservice emits an error-level log, THE System SHALL include the full stack trace in the `context.stackTrace` field of the JSON log entry.
5. THE System SHALL ensure that no log entry contains plaintext secrets, JWT tokens, or personally identifiable information beyond the `userId` field.

---

### Requirement 13: CI/CD Pipeline

**User Story:** As a platform engineer, I want an automated CI/CD pipeline that builds, tests, scans, and deploys every service on each merge to main, so that releases are reproducible and human intervention is not required for standard deployments.

#### Acceptance Criteria

1. THE System SHALL implement a CI/CD pipeline using GitHub Actions (or an equivalent system) triggered on every pull request and merge to the `main` branch.
2. WHEN a pull request is opened, THE CI Pipeline SHALL run linting, unit tests, integration tests, and property-based tests for all changed services, and SHALL block the merge if any step fails.
3. WHEN a merge to `main` occurs, THE CI Pipeline SHALL build Docker images for all changed services, tag them with the commit SHA, push them to a container registry, scan them for critical CVEs using Trivy, and block promotion if critical CVEs are found.
4. WHEN a Docker image passes all CI checks, THE CI Pipeline SHALL deploy the image to the staging environment using `helm upgrade --atomic` and run a smoke-test suite against the staging API Gateway.
5. WHEN the staging smoke tests pass, THE CI Pipeline SHALL require a manual approval gate before deploying to the production environment.
6. THE CI Pipeline SHALL cache Docker build layers and package manager dependencies between runs so that the end-to-end pipeline completes within 15 minutes for a single-service change.
7. WHEN a production deployment fails, THE CI Pipeline SHALL automatically execute `helm rollback` to the last successful release and notify the on-call channel.

---

### Requirement 14: Database Strategy per Service

**User Story:** As a platform engineer, I want each microservice to own its database schema and access only its own tables, so that services are independently deployable without shared schema coupling.

#### Acceptance Criteria

1. THE System SHALL provision a separate PostgreSQL database (or schema) for each of the following service domains: Auth Service, User-Health Service, Catalog Service, Order Service, and Delivery Service.
2. THE System SHALL ensure that no microservice connects directly to another service's database; all cross-domain data access SHALL occur through service APIs or Kafka events.
3. THE System SHALL migrate each service's tables from the existing monolith Prisma schema to the appropriate per-service database as a one-time migration script tracked in the respective service's repository.
4. THE System SHALL configure PgBouncer (or an equivalent connection pooler) in front of each service's PostgreSQL primary, with a maximum pool size of 50 connections per service.
5. WHEN a service database primary node becomes unavailable, THE System SHALL automatically promote the read replica to primary within 30 seconds using the cloud provider's managed failover mechanism.
6. THE System SHALL take automated daily backups of each service database and retain backups for a minimum of 30 days, with point-in-time recovery enabled.
7. WHEN a database schema migration is required, THE System SHALL execute the migration as part of the service's CI/CD pipeline using a Kubernetes Job that runs before the new service pods are started, and SHALL roll back the migration automatically if the Job fails.

---

### Requirement 15: Production-Level Property-Based Testing Strategy

**User Story:** As a quality engineer, I want a property-based testing strategy applied to all critical invariants across services, so that edge cases generated by arbitrary inputs are continuously validated.

#### Acceptance Criteria

1. THE System SHALL implement property-based tests using a PBT library (e.g., fast-check for TypeScript, Hypothesis for Python) for every microservice containing domain logic.
2. THE Auth Service PBT suite SHALL verify that for any valid combination of user credentials, the issued JWT decodes to a payload where `sub` equals the user's ID and `exp` is exactly 900 seconds (15 minutes) after `iat`.
3. THE Catalog Service PBT suite SHALL verify that for any arbitrary MenuItem input with calories ∈ [0, 10 000], protein ∈ [0, 500], fat ∈ [0, 500], and fiber ∈ [0, 500], the Health Score output is always in the range [0, 10].
4. THE Order Service PBT suite SHALL verify that for any sequence of valid OrderStatus transitions, the resulting status is always a valid member of the OrderStatus enum, and that illegal transitions (e.g., DELIVERED → CONFIRMED) are rejected with an HTTP 422 response.
5. THE User-Health Service PBT suite SHALL verify that for any arbitrary BodyStats input (age ∈ [1, 120], weight ∈ [1, 500], height ∈ [50, 300]), the computed BMR is a positive finite number.
6. THE User-Health Service PBT suite SHALL verify that for any arbitrary set of OrderItem calorie snapshots summed into a DailyLog, the `caloriesConsumed` value equals the arithmetic sum of all snapshot values and is never negative.
7. THE CI Pipeline SHALL execute the full PBT suite on every pull request with a minimum of 1 000 generated test cases per property, and SHALL report the seed used for each run so that failures are reproducible.
8. WHEN a PBT run discovers a failing example, THE CI Pipeline SHALL shrink the failing input to its minimal form and include the minimal counterexample and the seed in the pull request check output.

---

### Requirement 16: Service Mesh and Network Policies

**User Story:** As a security engineer, I want all east-west traffic governed by a service mesh and Kubernetes NetworkPolicies, so that no service can communicate with an unauthorized peer.

#### Acceptance Criteria

1. THE System SHALL deploy a service mesh (Istio or Linkerd) in the production Kubernetes cluster that automatically injects sidecar proxies into all microservice pods.
2. THE System SHALL configure the service mesh to deny all east-west traffic by default and permit only explicitly declared service-to-service communication paths.
3. THE following communication paths SHALL be explicitly permitted: API Gateway → all six microservices; Order Service → Kafka (produce); User-Health Service → Kafka (consume `order.delivered`); Delivery Service → Kafka (produce); Notification Service → Kafka (consume all `order.*` and `delivery.*` topics); Catalog Service → RabbitMQ (produce `flash-deal-expiry`); Notification Service → RabbitMQ (consume `notifications` and `flash-deal-expiry`).
4. THE System SHALL configure Kubernetes NetworkPolicy resources in each namespace that deny all ingress and egress except on explicitly permitted ports and to explicitly permitted peer selectors.
5. WHEN a service mesh certificate expires, THE System SHALL automatically renew the certificate without pod restart and without dropping in-flight requests.

---

### Requirement 17: Health Checks and Graceful Shutdown

**User Story:** As a platform engineer, I want all services to implement health-check endpoints and handle shutdown signals gracefully, so that Kubernetes can safely route traffic and drain pods without dropping in-flight requests.

#### Acceptance Criteria

1. THE System SHALL implement a `GET /health/live` endpoint on every microservice that returns HTTP 200 when the process is running and HTTP 503 when the process is in a terminal error state.
2. THE System SHALL implement a `GET /health/ready` endpoint on every microservice that returns HTTP 200 only when the service has established connections to its PostgreSQL database, Redis, and all required Kafka/RabbitMQ brokers, and returns HTTP 503 otherwise.
3. WHEN a microservice pod receives a SIGTERM signal, THE System SHALL stop accepting new inbound connections, complete all in-flight requests within 30 seconds, flush buffered log entries, and then exit cleanly.
4. THE System SHALL configure a Kubernetes `terminationGracePeriodSeconds` of 60 seconds for every microservice Deployment to allow the graceful shutdown period to complete before a SIGKILL is issued.
5. IF the `/health/ready` endpoint returns HTTP 503 for more than 10 consecutive seconds, THEN Kubernetes SHALL remove the pod from the Service endpoint list and stop routing new requests to it.

