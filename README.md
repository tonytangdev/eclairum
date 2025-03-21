# Eclairum

A monorepo project built with Turborepo, featuring a NestJS backend and NextJS web application.

## Project Structure

This project is organized as a monorepo using pnpm workspaces and Turborepo:

```
./
├── packages/               # Shared packages
│   ├── core/               # Business logic and domain models
│   ├── eslint-config/      # Shared ESLint configuration
│   ├── ngrok/              # Ngrok integration utilities
│   ├── typescript-config/  # Shared TypeScript configuration
├── apps/                   # Applications
│   ├── backend/            # NestJS backend application
│   ├── web/                # NextJS 15 frontend application
```

## Prerequisites

- Node.js (v20+)
- pnpm (v8+)
- Docker and Docker Compose (for development and deployment)

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/tonytangdev/eclairum.git
cd eclairum
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

Create appropriate `.env` files in each app directory. See the respective app documentation for details.

4. Start development servers:

```bash
pnpm dev
```

## Development

### Building all packages and apps

```bash
pnpm build
```

### Running tests

```bash
pnpm test
```

### Linting

```bash
pnpm lint
```

## Deployment

Each application has its own deployment process. See the individual app README files for specific deployment instructions:

- [Backend Deployment](./apps/backend/README.md)
- [Web Deployment](./apps/web/README.md)

## Docker

Docker configurations are available for development and production environments. See each application's documentation for Docker-specific instructions.

## Package Development

### Core Package

The `core` package contains all business logic and domain models used across the applications. See the [Core Package documentation](./packages/core/README.md) for more information.

### Shared Configurations

The repository includes shared configurations for TypeScript and ESLint to ensure consistency across all packages and applications.

## Contributing

1. Follow the established code style and architecture
2. Write tests for new features
3. Update documentation when necessary
4. Use conventional commits for your commit messages

## License

This project is licensed under the terms specified in the license file.
