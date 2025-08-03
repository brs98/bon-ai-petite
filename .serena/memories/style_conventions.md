# Code Style and Conventions

## TypeScript/React Conventions

- **File Extensions**: `.tsx` for React components, `.ts` for utilities
- **Imports**: Use absolute imports with `@/` prefix (configured in
  tsconfig.json)
- **Components**: Functional components with TypeScript
- **Props**: Define explicit prop interfaces/types
- **Naming**: PascalCase for components, camelCase for functions/variables

## Code Structure Patterns

- **Server Components**: Default in app directory (Next.js 13+ App Router)
- **Client Components**: Explicitly marked with `'use client'` directive
- **Server Actions**: Marked with `'use server'` directive, placed in
  `actions.ts` files
- **Form Handling**: Use `useActionState` hook with server actions
- **Database**: Drizzle ORM with schema in `lib/db/schema.ts`

## UI/Styling Conventions

- **CSS Framework**: Tailwind CSS with utility classes
- **Components**: shadcn/ui component library
- **Animations**: Framer Motion (imported as `motion`)
- **Icons**: Lucide React icons
- **Responsive**: Mobile-first design approach

## Authentication & Security

- **JWT**: Stored in httpOnly cookies for security
- **Session Management**: Server-side session verification
- **Route Protection**: Global middleware for authentication
- **Password Hashing**: bcryptjs with salt rounds

## Database Patterns

- **Schema**: Defined in `lib/db/schema.ts` using Drizzle
- **Queries**: Abstracted in `lib/db/queries.ts`
- **Migrations**: Generated with `drizzle-kit generate`

## Error Handling

- **Validation**: Zod schemas for form/API validation
- **User Feedback**: Error states in forms with user-friendly messages
- **Server Actions**: Return error/success states to client

## File Organization

- **Components**: Reusable UI in `components/ui/`
- **Pages**: App Router pages in `app/` directory
- **Business Logic**: Utilities and services in `lib/`
- **Types**: Shared TypeScript types in `types/`
