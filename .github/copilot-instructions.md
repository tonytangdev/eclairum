# Copilot Instructions

- Always apply clean code principles
- Always create tests using jest and @faker-js
- The any type is forbidden
- Always use the strict mode in TypeScript
- The project uses pnpm as package manager
- The project uses pnpm workspaces

The project is a mono-repo with the following structure:
./
├── packages
│   ├── core
│   ├── eslint-config
│   ├── ngrok
│   ├── typescript-config
├── apps
│   ├── backend
│   ├── web

## Core

The core package contains the business logic of the project. It should not have any dependencies on the other packages.

## Backend

The backend app is a NestJS application.

## Web

The web app is a NextJS application.

- Use Shadcn components
- Use TailwindCSS
