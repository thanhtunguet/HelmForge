# Task Completion Checklist

When completing a coding task in HelmForge, follow these steps:

## 1. Code Quality Checks
```bash
# Run ESLint to check for linting errors
npm run lint
```

## 2. Type Checking
```bash
# TypeScript type checking (if needed, though not in package.json scripts)
# Vite build process includes type checking
npm run build
```

## 3. Build Verification
```bash
# Verify the build succeeds
npm run build

# Or build in development mode for faster feedback
npm run build:dev
```

## 4. Manual Testing
- Start the development server: `npm run dev`
- Test the changes at http://localhost:8080
- Verify all affected features work correctly
- Check browser console for errors

## 5. Code Review Checklist
- [ ] Single quotes used (not double quotes)
- [ ] No `any` types used
- [ ] Path alias `@/*` used for src imports
- [ ] TypeScript types properly defined
- [ ] Components follow functional pattern with hooks
- [ ] Zustand store updated if state management changes
- [ ] Database operations use `db-service.ts` functions
- [ ] Forms use React Hook Form + Zod validation
- [ ] UI components from shadcn/ui where applicable
- [ ] Tailwind CSS for styling

## 6. Git Workflow (if committing)
```bash
git status
git add .
git commit -m "descriptive message"
# Push only if instructed
git push
```

## Important Notes
- **No automated tests** - Manual testing is required
- **No Prettier** - ESLint handles formatting rules
- **Build before commit** - Ensure no TypeScript errors
- TypeScript config is relaxed (strictNullChecks: false), but still avoid type errors
- Check that all imports resolve correctly with path alias