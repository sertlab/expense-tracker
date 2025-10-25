# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **ExpenseTracker** application built with Nx monorepo, React 19, Vite, and TypeScript. The workspace uses pnpm for package management and follows a strict TypeScript configuration with project references.

## Architecture

### Monorepo Structure

The codebase follows an Nx monorepo pattern with a clear separation between applications and libraries:

- **apps/**:
  - `apps/web`: Main React application using Vite bundler, runs on port 4200
  - `apps/web-e2e`: Playwright end-to-end tests for the web application
- **libs/**: Shared libraries organized by domain
  - `@expense-tracker/db`: Database layer
  - `@expense-tracker/auth`: Authentication logic
  - `@expense-tracker/validation`: Validation utilities
  - `@expense-tracker/contracts`: Shared types and interfaces
  - `@expense-tracker/util`: Common utilities

### Package Management

- Uses **pnpm workspaces** with automatic peer dependency installation
- All libraries use ES modules (`"type": "module"`)
- Libraries export via `@expense-tracker/source` custom condition for development, falling back to built dist files
- TypeScript project references are used for efficient incremental builds

### Build System

The project uses Nx with inferred tasks from plugins:
- `@nx/js/typescript`: Handles TypeScript compilation and typechecking
- `@nx/vite/plugin`: Manages Vite build, serve, test, and preview targets
- `@nx/playwright/plugin`: Configures e2e testing

## Common Commands

### Development

```bash
# Start the web application development server
npx nx serve web
# or
npx nx dev web

# Run a specific project's task
npx nx <target> <project-name>

# View the project dependency graph
npx nx graph
```

### Building

```bash
# Build the web application
npx nx build web

# Build a specific library
npx nx build <library-name>
```

### Testing

```bash
# Run unit tests for the web app (Vitest)
npx nx test web

# Run e2e tests (Playwright)
npx nx e2e web-e2e

# Run unit tests for a specific library
npx nx test <library-name>
```

### Type Checking

```bash
# Type check the entire workspace
npx nx typecheck web

# Type check a specific library
npx nx typecheck <library-name>

# Sync TypeScript project references
npx nx sync

# Check if TypeScript project references are in sync (useful for CI)
npx nx sync:check
```

### Library Generation

```bash
# Generate a new publishable library
npx nx g @nx/js:lib packages/<name> --publishable --importPath=@expense-tracker/<name>

# Generate a new React component (uses CSS by default)
npx nx g @nx/react:component <component-name>
```

## Development Guidelines

### TypeScript Configuration

- The project uses **strict TypeScript** settings with composite builds
- Project references are automatically managed by Nx (run `npx nx sync` if needed)
- Custom module resolution condition `@expense-tracker/source` allows importing from source files during development
- All compiler options include: `strict`, `noImplicitReturns`, `noUnusedLocals`, `noFallthroughCasesInSwitch`, etc.

### Library Development

- Libraries follow a standard structure: `src/lib/<name>.ts` + `src/index.ts`
- All libraries export via `dist/index.js` after build
- Use `@expense-tracker/<library-name>` import paths when consuming libraries
- Libraries must maintain TypeScript declarations (`*.d.ts` files)

### React Configuration

- React 19 is used throughout
- Default styling is CSS
- No linter is configured (linter: "none" in generators)
- Vite is the default bundler for React applications
- Development server runs on localhost:4200

### Nx Caching

- The project is connected to Nx Cloud (ID: 68fcc8c74b64606c7b793842) for remote caching
- Named inputs define what files trigger rebuilds (production excludes test files)

## Key Files

- `nx.json`: Nx workspace configuration with plugins and generators
- `tsconfig.base.json`: Base TypeScript configuration with strict settings
- `tsconfig.json`: Root config with project references
- `pnpm-workspace.yaml`: pnpm workspace package definitions (covers `apps/*` and `libs/*`)
- `apps/web/vite.config.ts`: Vite configuration for the web app
- `apps/web-e2e/playwright.config.ts`: Playwright e2e test configuration
