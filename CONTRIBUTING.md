# Contributing to pg-tables-to-zod

Thank you for your interest in contributing to our project! This guide will help you get started with the development process.

## Development Setup

### Prerequisites

- Bun installed on your system

### Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/springtree/pg-tables-to-zod.git`
3. Navigate to the project directory: `cd pg-tables-to-zod`
4. Install dependencies: `bun install`

## Development Workflow

1. Create a new branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Check and fix code style and formatting issues: `bun run lint:fix`
4. Run tests: `bun run test`
5. Build the project: `bun run build`
6. Commit your changes using the conventions below
7. Push your branch to your fork
8. Open a pull request

## Commit Message Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/) for clear and structured commit messages.
A git hook checks them with [commitlint](https://commitlint.js.org).
Pull requests are squash merged, so the pull request title becomes the commit on `main`. It must follow the same conventions and is checked on every pull request. It decides the next version and the changelog when releasing:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code changes that neither fix bugs nor add features
- `perf:` Performance improvements
- `test:` Adding or updating tests
- `chore:` Maintenance tasks, dependencies, etc.

## Pull Request Guidelines

1. Update documentation if needed
2. Ensure all tests pass
3. Address any feedback from code reviews
4. Once approved, your PR will be merged

## Code of Conduct

Please be respectful and constructive in all interactions within our community.

## Questions?

If you have any questions, please [open an issue](https://github.com/springtree/pg-tables-to-zod/issues/new) for discussion.

Thank you for contributing to pg-tables-to-zod!
