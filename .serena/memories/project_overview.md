# HelmForge Project Overview

## Purpose
HelmForge (formerly Helm Designer) is a visual tool for creating, configuring, and exporting production-ready Helm charts for Kubernetes microservices architectures. Users can design complex Helm chart structures without writing YAML manually through an intuitive web interface.

## Key Features
- Visual Helm Chart Designer with microservices management
- ConfigMaps, Secrets, and Ingress configuration
- Chart versioning and export to .tgz packages
- Private Helm Registry via Supabase Edge Functions
- Nginx Gateway Integration and Redis support
- Service Account Management with API keys
- Dark mode support

## Tech Stack

### Frontend
- **React 18.3** - UI framework
- **TypeScript 5.8** - Type safety
- **Vite 5.4** - Build tool and dev server (port 8080)
- **React Router 6.30** - Client-side routing
- **TanStack Query 5.83** - Server state management
- **Zustand 5.0** - Client state management (with persist middleware)
- **shadcn/ui** - UI component library (Radix UI primitives)
- **Tailwind CSS 3.4** - Styling
- **React Hook Form 7.61** - Form management
- **Zod 3.25** - Schema validation

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Authentication (Email/Password, OAuth)
  - Edge Functions (Helm registry)
  - Row Level Security (RLS)

### Build & Deploy
- **GitHub Actions** - CI/CD pipeline
- **GitHub Pages** - Static hosting

## Project Structure
```
src/
├── components/
│   ├── auth/          # Authentication components
│   ├── layout/        # Layout components (Sidebar, MainLayout)
│   ├── template/      # Template management components
│   ├── theme/         # Theme switcher
│   └── ui/            # shadcn/ui components
├── hooks/             # Custom React hooks
├── integrations/
│   └── supabase/      # Supabase client and types
├── lib/
│   ├── helm-generator.ts  # Helm chart generation logic
│   ├── store.ts          # Zustand state management
│   ├── db-service.ts     # Database operations
│   └── utils.ts          # Utility functions
├── pages/             # Page components (Dashboard, Auth, etc.)
├── types/
│   └── helm.ts        # TypeScript type definitions
├── App.tsx            # Main app component with routing
└── main.tsx           # Application entry point
```

## Environment
- Development server: http://localhost:8080
- Platform: Linux
- Package managers: npm or bun
- Node.js version: 20.x or higher