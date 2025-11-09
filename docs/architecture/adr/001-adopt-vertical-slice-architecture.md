# ADR-001: Adopt Vertical Slice Architecture for Backend Features

**Date**: 2025-11-08
**Status**: Proposed
**Deciders**: Engineering Team
**Technical Story**: Architecture Modernization - Phase 1

## Context and Problem Statement

Our backend currently uses a mix of architectural patterns - some features use Clean Architecture with domain/infrastructure/presentation layers, while others use flat route files. This inconsistency makes it difficult for developers to understand where to add new code and leads to duplication (e.g., 3 different route files for properties).

We need a consistent, scalable architecture that:
- Makes it easy to locate all code for a specific feature
- Supports CQRS (Command Query Responsibility Segregation) for better separation
- Enables easy extraction to microservices in the future
- Reduces cognitive load for developers

## Decision Drivers

- Developer experience and onboarding time
- Code maintainability and testability
- Scalability to microservices
- Clear boundaries between features
- Modern best practices (2025)
- Team velocity

## Considered Options

1. **Clean Architecture (Current)**: Separate by layer (domain/infrastructure/presentation)
2. **Vertical Slice Architecture**: Organize by feature/use case
3. **Hybrid Approach**: Vertical slices with CQRS pattern
4. **Ports and Adapters (Hexagonal)**: Pure hexagonal architecture

## Decision Outcome

Chosen option: **Hybrid Approach - Vertical Slice Architecture with CQRS**, because:
- Best balance between organization and simplicity
- Each use case is self-contained and easy to find
- CQRS pattern naturally separates reads and writes
- Supports future microservices extraction
- Lower cognitive load than pure Clean Architecture
- Modern best practice recommended for 2025

### Structure

```
server/features/[feature]/
├── commands/                    # Write operations
│   └── [command-name]/
│       ├── handler.ts          # Business logic
│       ├── validator.ts        # Input validation
│       ├── types.ts            # Command types
│       └── route.ts            # HTTP endpoint
├── queries/                     # Read operations
│   └── [query-name]/
│       ├── handler.ts          # Query logic
│       ├── types.ts            # Query types
│       └── route.ts            # HTTP endpoint
├── domain/
│   ├── [entity].ts             # Domain model
│   └── [entity].rules.ts       # Business rules
└── infrastructure/
    └── [entity].repository.ts  # Data access
```

### Example: Create Reservation

```typescript
// server/features/reservations/commands/create-reservation/handler.ts
export async function createReservationHandler(input: CreateReservationInput) {
  // All logic for creating a reservation in one place
  const validated = await validateReservationInput(input);
  const reservation = await reservationRepository.create(validated);
  await notificationService.sendConfirmation(reservation);
  return reservation;
}
```

### Consequences

**Good**:
- All code for a feature is in one place - easy to find and modify
- New developers can understand features independently
- Test files naturally live next to the code they test
- Easy to identify microservice boundaries
- Follows CQRS pattern naturally
- Reduces merge conflicts (features are isolated)

**Bad**:
- Some code duplication across features (acceptable trade-off)
- Requires discipline to maintain boundaries
- Migration effort from current structure

**Neutral**:
- More folders/files (but better organized)
- Need to establish conventions for shared utilities

### Confirmation

We will measure success by:
- Time to implement new features (target: 30% reduction)
- Developer onboarding time (target: 50% reduction)
- Code coupling metrics (target: <10% coupling between features)
- Team satisfaction survey after 3 months

## Pros and Cons of the Options

### Clean Architecture (Current)

**Pros**:
- Clear separation of concerns
- Testability
- Framework independence
- Well-documented pattern

**Cons**:
- Navigation requires jumping between layers
- Adding a feature requires touching multiple directories
- Cognitive load - need to understand entire architecture
- Can lead to over-engineering for simple features

### Pure Vertical Slice Architecture

**Pros**:
- Everything for a feature in one place
- Minimal abstraction
- Fast to implement features
- Easy to understand

**Cons**:
- May lead to code duplication
- Less structure for complex domains
- No CQRS separation

### Hybrid (Chosen)

**Pros**:
- Best of both worlds
- CQRS pattern built-in
- Clear boundaries
- Scalable
- Modern best practice

**Cons**:
- Requires team discipline
- Migration effort

### Ports and Adapters (Hexagonal)

**Pros**:
- Very clean separation
- Highly testable
- Framework agnostic

**Cons**:
- High complexity
- Steep learning curve
- Overkill for our current scale

## Migration Plan

### Phase 1: Pilot (Week 1-2)
- Implement for reservations feature
- Get team feedback
- Document learnings

### Phase 2: Rollout (Week 3-4)
- Migrate properties feature
- Migrate financial feature
- Update documentation

### Phase 3: Cleanup (Week 5)
- Remove old route files
- Update tests
- Team training

### Phase 4: Ongoing
- Apply pattern to all new features
- Refactor legacy code opportunistically

## More Information

### References
- [Vertical Slice Architecture - Jimmy Bogard](https://www.jimmybogard.com/vertical-slice-architecture/)
- [CQRS Pattern - Martin Fowler](https://martinfowler.com/bliki/CQRS.html)
- [Feature-Sliced Design](https://feature-sliced.design/)

### Examples
- See `/server/features/reservations/` for reference implementation
- See `/docs/architecture/BACKEND_ARCHITECTURE.md` for detailed guide

## Links

- Related: ADR-002 (Frontend Feature-Sliced Design)
- Related: ADR-003 (Monorepo Structure)
- Implementation: [GitHub Issue #XXX]
