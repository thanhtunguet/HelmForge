# Architecture and Design Patterns

## Application Architecture

### State Management Strategy
- **Zustand Store** (`lib/store.ts`): Global application state with persist middleware
  - Templates, Services, ConfigMaps, Secrets, Ingresses, Chart Versions
  - CRUD operations for all entities
  - Synchronizes with Supabase database via `db-service.ts`
- **TanStack Query**: Server state caching and synchronization
- **React Hook Form + Zod**: Form state and validation

### Data Flow
1. User interacts with UI components
2. Components call Zustand store actions
3. Store actions call `db-service.ts` functions
4. Database operations execute against Supabase
5. Store updates local state
6. React re-renders affected components

### Database Layer
- **`db-service.ts`**: Centralized database operations
  - Provides type-safe CRUD functions for each entity type
  - Returns typed database rows and handles inserts
  - Uses Supabase client from `integrations/supabase/`

### Routing
- React Router with the following main routes:
  - `/` - Landing page
  - `/auth` - Authentication
  - `/dashboard` - Main dashboard (template list)
  - `/templates/new` - Create new template
  - `/templates/:id` - Template detail/edit
  - `/templates/:templateId/versions/new` - Create version
  - `/templates/:templateId/versions/:versionId` - Version detail
  - `/service-accounts` - Service account management
  - `/documentation` - Documentation

### Component Organization
- **Pages**: Top-level route components
- **Layout**: Structural components (MainLayout, Sidebar)
- **Template**: Template-specific UI components
- **Auth**: Authentication forms and flows
- **Theme**: Dark/light mode switcher
- **UI**: shadcn/ui reusable components

## Key Design Patterns

### Helm Chart Generation
- **Generator Pattern**: `helm-generator.ts` creates Helm chart YAML files
- Takes template + version data and produces complete chart structure
- Generates deployment, service, ingress, configmap, secret manifests

### Database Persistence
- **Repository Pattern**: `db-service.ts` abstracts database operations
- Each entity type has dedicated CRUD functions
- Type-safe operations with TypeScript interfaces

### UI Composition
- **Compound Components**: shadcn/ui components compose smaller Radix primitives
- **Render Props**: React Hook Form uses render prop pattern
- **Custom Hooks**: Encapsulate reusable logic (in `hooks/`)

### Authentication Flow
- Supabase Auth handles user sessions
- Protected routes check authentication state
- Row Level Security (RLS) in database ensures data isolation

## Supabase Integration
- **Tables**: templates, services, config_maps, tls_secrets, opaque_secrets, ingresses, chart_versions, service_accounts
- **Auth**: Email/password and OAuth providers
- **Edge Functions**: `helm-registry` function serves Helm charts
- **RLS Policies**: Ensure users only access their own data

## Important Conventions
- All database operations go through `db-service.ts`, never direct Supabase calls from components
- Store actions are async and handle errors with toast notifications
- Components use Zustand store for data access, not direct database queries
- Type definitions in `types/helm.ts` match database schema