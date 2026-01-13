# Contributing Guide

Thank you for considering contributing to the Broersma Bouwadvies Backoffice!

---

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/Brommah/BBR.git
cd BBR

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env.local
# Fill in your Supabase credentials

# 4. Initialize database
npm run db:push
npm run db:seed

# 5. Start development server
npm run dev
```

---

## 📋 Development Workflow

### Before You Start

1. Create a new branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make sure all checks pass:
   ```bash
   npm run validate
   ```

### During Development

1. **Run the dev server:**
   ```bash
   npm run dev
   ```

2. **Run tests in watch mode:**
   ```bash
   npm run test
   ```

3. **Check types as you code:**
   ```bash
   npm run typecheck
   ```

### Before Committing

Always run the full validation:

```bash
npm run validate
```

This runs:
- TypeScript type checking
- ESLint
- All unit tests

---

## 🧪 Testing

### Unit Tests

Located in `tests/`. Run with:

```bash
npm run test           # Watch mode
npm run test:run       # Single run
npm run test:coverage  # With coverage report
npm run test:ui        # Visual UI
```

**Writing tests:**

```typescript
// tests/lib/example.test.ts
import { describe, it, expect, vi } from 'vitest'

describe('MyFunction', () => {
  it('should do something', () => {
    expect(myFunction()).toBe(expected)
  })
})
```

### E2E Tests

Located in `e2e/`. Run with:

```bash
npm run test:e2e           # Headless
npm run test:e2e:headed    # With browser
npm run test:e2e:ui        # Playwright UI
```

**Writing E2E tests:**

```typescript
// e2e/example.spec.ts
import { test, expect } from '@playwright/test'

test('should load page', async ({ page }) => {
  await page.goto('/intake')
  await expect(page.getByRole('heading')).toBeVisible()
})
```

---

## 📁 Project Structure

```
├── app/                 # Next.js pages and API routes
├── components/          # React components
│   ├── ui/             # Shadcn UI components (don't edit)
│   └── ...             # Custom components
├── lib/                 # Business logic and utilities
├── prisma/              # Database schema and seeds
├── tests/               # Unit tests
├── e2e/                 # E2E tests
└── docs/                # Documentation
```

---

## 🎨 Code Style

### TypeScript

- Use **strict mode** (no `any`)
- Prefer **interfaces** over types for objects
- Use **explicit return types** for functions

```typescript
// ✅ Good
interface Lead {
  id: string
  name: string
}

function getLead(id: string): Lead | null {
  // ...
}

// ❌ Bad
function getLead(id: any): any {
  // ...
}
```

### React Components

- Use **functional components** with hooks
- Use **TypeScript props** interfaces
- Co-locate styles with components

```typescript
// ✅ Good
interface ButtonProps {
  onClick: () => void
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
}

export function Button({ onClick, children, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} className={styles[variant]}>
      {children}
    </button>
  )
}
```

### File Naming

- Components: `PascalCase.tsx`
- Utilities: `kebab-case.ts`
- Tests: `*.test.ts` or `*.spec.ts`

---

## 📝 Commit Messages

Follow [Conventional Commits](https://conventionalcommits.org/):

```
feat: add quote approval notification
fix: correct pipeline drag-drop on mobile
docs: update API documentation
test: add E2E tests for intake form
chore: update dependencies
refactor: simplify auth store logic
```

---

## 🔄 Pull Request Process

1. **Update documentation** if you changed APIs or added features

2. **Add/update tests** for your changes

3. **Run validation:**
   ```bash
   npm run validate
   ```

4. **Create PR** with:
   - Clear title following commit conventions
   - Description of what changed and why
   - Screenshots for UI changes
   - Link to related issue (if any)

5. **Address review feedback** promptly

---

## 🏗️ Adding New Features

### New Page

1. Create route in `app/your-page/page.tsx`
2. Add to navigation in `components/app-sidebar.tsx`
3. Add access control if needed
4. Add E2E test in `e2e/`

### New Component

1. Create in appropriate `components/` subdirectory
2. Add TypeScript interface for props
3. Add unit test in `tests/components/`
4. Document usage in component file

### New Server Action

1. Add to `lib/db-actions.ts`
2. Add input validation
3. Add activity logging
4. Add unit test
5. Update API documentation

### New Database Model

1. Add to `prisma/schema.prisma`
2. Run `npm run db:generate`
3. Add seed data in `prisma/seed.ts`
4. Add CRUD actions in `lib/db-actions.ts`

---

## 🐛 Reporting Bugs

Please include:

1. **Description** of the bug
2. **Steps to reproduce**
3. **Expected behavior**
4. **Actual behavior**
5. **Screenshots** (if applicable)
6. **Environment** (browser, OS)

---

## 💡 Feature Requests

Open an issue with:

1. **Problem** you're trying to solve
2. **Proposed solution**
3. **Alternatives** you considered
4. **Additional context**

---

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/docs)

---

## ❓ Questions?

- Open a GitHub issue
- Contact: info@broersma-bouwadvies.nl

---

Thank you for contributing! 🙏
