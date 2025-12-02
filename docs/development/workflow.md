# Development Workflow

## Git Workflow

We use a feature-branch workflow.

### 1. Create a Branch
Always create a new branch for your work. Use descriptive names:
- `feature/new-mechanic`
- `fix/npc-pathfinding`
- `refactor/world-manager`

```bash
git checkout -b feature/my-feature
```

### 2. Commit Changes
Write clear, descriptive commit messages.
```bash
git add .
git commit -m "feat: Add new crafting recipe for iron sword"
```
*Note: Pre-commit hooks will automatically run linting and formatting.*

### 3. Push and PR
Push your branch to the remote repository and open a Pull Request.
```bash
git push origin feature/my-feature
```

---

## Branching Strategy
- **`master`**: Stable, production-ready code.
- **`develop`**: Integration branch for next release (optional).
- **`feature/*`**: New features.
- **`fix/*`**: Bug fixes.
- **`docs/*`**: Documentation updates.

---

## Code Style
See [Linting & Code Quality](linting.md) for details on our style guides and tools.
