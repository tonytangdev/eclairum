# Eclairum Core

The core package for Eclairum, containing business logic, domain models, and shared functionality. This package is designed to be application-agnostic and contains no dependencies on specific frameworks or technologies.

## Purpose

The core package centralizes all business rules, ensuring consistency across different applications within the Eclairum ecosystem. By separating business logic from application-specific code, we:

- Maintain a clear separation of concerns
- Enable reuse across multiple applications
- Simplify testing of business rules
- Facilitate changes to the underlying technologies without affecting business logic

## Package Structure

```
./
├── constants/      # Shared constants and enumerations
├── entities/       # Domain entities and value objects
├── errors/         # Custom error definitions
├── interfaces/     # Type definitions and interfaces
├── services/       # Core business services
├── shared/         # Shared utilities and helpers
└── use-cases/      # Business use cases and operations
```

## Usage

### Installation

The core package is automatically installed as a workspace dependency in the monorepo. If needed, you can install it explicitly:

```bash
pnpm add @eclairum/core@workspace:*
```

### Importing

You can import from the main package or specific subpaths:

```typescript
// Import from main package
import { SomeEntity } from '@eclairum/core';

// Import from specific subpaths
import { SomeEntity } from '@eclairum/core/entities';
import { SomeInterface } from '@eclairum/core/interfaces';
import { SomeUseCase } from '@eclairum/core/use-cases';
import { SomeError } from '@eclairum/core/errors';
import { SOME_CONSTANT } from '@eclairum/core/constants';
import { someHelper } from '@eclairum/core/shared';
```

## Development

### Testing

The core package has 100% test coverage requirements. To run tests:

```bash
# From root of monorepo
pnpm --filter @eclairum/core test

# With coverage report
pnpm --filter @eclairum/core test:cov
```

### Building

```bash
pnpm --filter @eclairum/core build
```

## Design Principles

The core package follows these key principles:

1. **Framework Independence**: No dependencies on external frameworks
2. **Clean Architecture**: Separation of entities, use cases, and interfaces
3. **Testability**: All components are designed for easy testing
4. **Single Responsibility**: Each class/module has a single responsibility
5. **Explicit Dependencies**: Dependencies are passed explicitly, not imported directly

## Extending Core

When adding new functionality to the core package:

1. Define interfaces in the `interfaces` directory
2. Create domain entities in the `entities` directory
3. Implement business logic in the `use-cases` directory
4. Add any necessary error definitions to the `errors` directory
5. Write comprehensive tests for all new code

## Guidelines

- Keep the package free from dependencies on specific frameworks or technologies
- Maintain 100% test coverage
- Use explicit typing (avoid `any`)
- Follow clean code principles
- Document public APIs
