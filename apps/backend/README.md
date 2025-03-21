<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# Eclairum Backend

The backend service for Eclairum, built with NestJS. This application handles all server-side logic, API endpoints, and database interactions.

## Technology Stack

- [NestJS](https://nestjs.com/) - A progressive Node.js framework for building server-side applications
- [TypeORM](https://typeorm.io/) - ORM for database interactions
- [PostgreSQL](https://www.postgresql.org/) - Primary database
- [Docker](https://www.docker.com/) - Containerization
- [Jest](https://jestjs.io/) - Testing framework

## Getting Started

### Prerequisites

- Node.js (v20+)
- pnpm (v8+)
- Docker and Docker Compose (for development with database)

### Environment Setup

The application uses different environment configurations:

- `.env.dev` - Development environment
- `.env.ci` - CI/CD environment
- `.env.production` - Production environment

Create these files based on your requirements. Example `.env.dev`:

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=eclairum_dev

# Application
PORT=4000
```

### Installation

```bash
# From root of monorepo
pnpm install
```

### Running the Application

```bash
# Development mode
pnpm --filter @eclairum/backend dev

# Production mode
pnpm --filter @eclairum/backend start:prod
```

### Docker Development Environment

Start the development database:

```bash
pnpm --filter @eclairum/backend docker:up
```

Stop the development database:

```bash
pnpm --filter @eclairum/backend docker:down
```

## Testing

### Running Unit Tests

```bash
pnpm --filter @eclairum/backend test
```

### Running E2E Tests

```bash
pnpm --filter @eclairum/backend test:e2e
```

### Test Coverage

```bash
pnpm --filter @eclairum/backend test:cov
```

## Deployment

### Building for Production

Run the build script:

```bash
./build-prod.sh
```

This script will:
1. Verify environment configuration
2. Test database connectivity
3. Build the Docker container
4. Optionally start the container

### Debugging Production Deployment

Use the debug connection script:

```bash
./debug-connection.sh
```

This script helps troubleshoot container connectivity issues.

## Docker Configuration

The application is containerized using Docker for easy deployment. The `Dockerfile` sets up a multi-stage build process that:

1. Installs dependencies
2. Builds the core package and other dependencies
3. Builds the backend application
4. Creates a production-ready container

Exposed port: 4000

## API Documentation

API documentation is available at `/api-docs` when the server is running in development mode.

## Project Structure

```
src/
├── common/         # Shared components, guards, filters
├── config/         # Configuration modules
├── dtos/           # Data Transfer Objects
├── entities/       # Database entities
├── modules/        # Feature modules
├── app.module.ts   # Main application module
└── main.ts         # Application entry point
```

## Dependencies

This project depends on the `@eclairum/core` package for business logic and domain models.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
