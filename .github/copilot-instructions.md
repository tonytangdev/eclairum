# Copilot Instructions

- Always apply clean code principles

1. Meaningful Names
Use intention-revealing names
Choose descriptive and unambiguous identifiers
Make meaningful distinctions
Use pronounceable and searchable names
Avoid encodings and mental mapping
2. Functions
Keep functions small (ideally under 20 lines)
Functions should do one thing only
Use descriptive function names
Minimize function parameters (0-2 is ideal)
Avoid flag parameters
Don't use side effects
3. Comments
Good code is self-documenting
Comments should explain "why," not "what"
Keep comments updated with code changes
Don't comment out code (use version control)
Use comments for legal information and warnings
4. Formatting
Follow consistent formatting rules
Use vertical spacing to separate concepts
Related code should be vertically dense
Keep lines reasonably short
Use standard indentation
5. Objects and Data Structures
Hide implementation details
Prefer polymorphism to conditionals
Encapsulate data and behavior together
6. Error Handling
Use exceptions rather than return codes
Create informative error messages
Don't return or pass null
7. SOLID Principles
Single Responsibility Principle
Open/Closed Principle
Liskov Substitution Principle
Interface Segregation Principle
Dependency Inversion Principle
8. Testing
Write tests first (TDD when possible)
Make tests readable
Tests should be fast, independent, and repeatable
9. DRY (Don't Repeat Yourself)
Avoid code duplication
Extract shared functionality
10. KISS (Keep It Simple, Stupid)
Simplicity over complexity
Solve the problem at hand, not imagined ones
11. YAGNI (You Aren't Gonna Need It)
Don't add functionality until needed
12. Separation of Concerns
Different parts of code should handle distinct responsibilities
13. Code Refactoring
Continuously improve code structure
Apply the "Boy Scout Rule" - leave code better than you found it

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
