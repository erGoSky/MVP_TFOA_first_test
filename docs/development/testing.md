# Testing Guide

## Python Tests (AI Service)

We use **pytest** for testing the Python backend.

### Running Tests
```bash
cd ai-service
python -m unittest discover . "test_*.py"
```

### Writing Tests
- Place tests in `ai-service/` with `test_` prefix.
- Use `unittest.TestCase` or pytest style functions.
- Mock external dependencies (like the Simulation Core).

---

## Integration Tests

We have end-to-end integration tests that verify the full stack.

### Running E2E Tests
```bash
cd ai-service
python test_integration_e2e.py
```
*Note: Ensure all services are running before executing E2E tests.*

---

## TypeScript Tests (Simulation Core)

*Coming soon: Jest setup for Simulation Core.*
