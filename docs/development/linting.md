# Code Quality & Linting

## Overview
This project uses comprehensive linting and code quality tools to ensure consistency and catch errors early.

- **Python**: Ruff (Linting + Formatting)
- **TypeScript/React**: ESLint + Prettier
- **Automation**: Pre-commit hooks + GitHub Actions

---

## Python Linting (ai-service)

We use **[Ruff](https://docs.astral.sh/ruff/)** for both linting and formatting. It replaces Flake8, Black, isort, and pydocstyle.

### Commands
```bash
cd ai-service

# Check for issues
ruff check .

# Auto-fix issues
ruff check --fix .

# Format code
ruff format .
```

### Configuration
- Config file: `.ruff.toml`
- Line length: 100
- Target version: Python 3.8+

---

## TypeScript Linting (client & simulation-core)

We use **ESLint** for linting and **Prettier** for formatting.

### Commands

**Client:**
```bash
cd client
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
npm run format      # Format all files
```

**Simulation Core:**
```bash
cd simulation-core
npm run lint
npm run lint:fix
npm run format
```

### Configuration
- ESLint: `.eslintrc.json`
- Prettier: `.prettierrc`

---

## Pre-commit Hooks

We use **[pre-commit](https://pre-commit.com/)** to automatically run checks before every commit.

### Installation
```bash
pip install pre-commit
pre-commit install
```

### What it checks
- Python linting (Ruff)
- TypeScript formatting (Prettier)
- Trailing whitespace
- End-of-file fixes
- YAML syntax

### Skipping Hooks
If you absolutely must skip checks (not recommended):
```bash
git commit -m "msg" --no-verify
```

---

## CI/CD

GitHub Actions automatically runs these checks on every push and pull request. See `.github/workflows/lint.yml`.
