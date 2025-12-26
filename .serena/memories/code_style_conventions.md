# Code Style and Conventions

## ESLint Configuration
- **Quotes**: Single quotes (enforced with error level)
  - `avoidEscape: true`
  - `allowTemplateLiterals: true`
- **No explicit any**: Enforced with error level
- **Unused variables**: Rule disabled (allowed)
- **React hooks**: Rules from recommended config
- **React refresh**: `only-export-components` rule disabled

## TypeScript Configuration
- **Path alias**: `@/*` maps to `./src/*`
- **Compiler options** (relaxed settings):
  - `noImplicitAny: false`
  - `noUnusedParameters: false`
  - `noUnusedLocals: false`
  - `strictNullChecks: false`
  - `skipLibCheck: true`
  - `allowJs: true`

## File Organization
- **Components**: Organized by feature/domain (auth, layout, template, theme, ui)
- **Naming**: 
  - React components: PascalCase (e.g., `Dashboard.tsx`, `MainLayout.tsx`)
  - Utility files: kebab-case (e.g., `helm-generator.ts`, `db-service.ts`)
  - Type files: snake_case or kebab-case (e.g., `helm.ts`)

## Code Patterns
- **State Management**: Zustand store with persist middleware
- **Data Fetching**: TanStack Query for server state
- **Form Handling**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database Operations**: Centralized in `db-service.ts`
- **Type Safety**: TypeScript interfaces and types in `types/helm.ts`

## Component Structure
- Functional components using arrow functions and `const`
- Hooks at the top of components
- No default exports for components (except in some legacy files)
- shadcn/ui components in `src/components/ui/`

## Import Style
- Path alias `@/` for src imports
- External dependencies first, then internal imports
- Grouped by category (React, libraries, components, types, utils)