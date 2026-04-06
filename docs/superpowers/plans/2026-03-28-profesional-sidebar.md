# Profesional Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a collapsible sidebar to the professional dashboard with Agenda, Pacientes, and Settings navigation.

**Architecture:** Replace the current top-only header layout in `ProfesionalLayout` with a `SidebarProvider` wrapping an `AppSidebar` component and the page content. The Settings route lives at `/settings` under `RequireAuth` without a role guard so any authenticated user can access it.

**Tech Stack:** React 19, React Router v7, shadcn/ui sidebar (already installed), lucide-react icons, Tailwind CSS v4

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/components/AppSidebar.tsx` | Sidebar UI: logo, nav items, settings footer |
| Create | `src/pages/AgendaPage.tsx` | Stub page for `/profesional/agenda` |
| Create | `src/pages/PacientesPage.tsx` | Stub page for `/profesional/pacientes` |
| Create | `src/pages/SettingsPage.tsx` | Stub page for `/settings` (universal) |
| Modify | `src/layouts/ProfesionalLayout.tsx` | Wrap with SidebarProvider + AppSidebar |
| Modify | `src/App.tsx` | Register the 3 new routes |

---

## Task 1: Create AppSidebar component

**Files:**
- Create: `src/components/AppSidebar.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { Calendar, Users, Settings } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const navItems = [
  { title: 'Agenda', url: '/profesional/agenda', icon: Calendar },
  { title: 'Pacientes', url: '/profesional/pacientes', icon: Users },
]

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1">
              <span className="font-display font-semibold text-primary text-lg tracking-tight group-data-[collapsible=icon]:hidden">
                EvalPro
              </span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive ? 'text-sidebar-primary' : ''
                      }
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  isActive ? 'text-sidebar-primary' : ''
                }
              >
                <Settings />
                <span>Settings</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build 2>&1 | grep -E "error|AppSidebar"
```

Expected: no errors referencing `AppSidebar`.

---

## Task 2: Update ProfesionalLayout to use the sidebar

**Files:**
- Modify: `src/layouts/ProfesionalLayout.tsx`

- [ ] **Step 1: Replace file contents**

```tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'

export function ProfesionalLayout() {
  const { user, profile, loading, signOut } = useAuth()

  if (loading) return <div className="min-h-screen bg-background" />
  if (!user) return <Navigate to="/login" replace />
  if (profile?.role !== 'profesional') return <Navigate to="/client/dashboard" replace />

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex flex-col flex-1 min-h-screen overflow-hidden">
        <header className="h-14 border-b border-outline-variant flex items-center justify-between px-4 bg-surface-container-low shrink-0">
          <SidebarTrigger />
          <div className="flex items-center gap-4">
            <span className="text-on-surface-variant text-sm">{user.email}</span>
            <button
              onClick={signOut}
              className="text-on-surface-variant text-sm hover:text-on-surface transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep -E "error|ProfesionalLayout"
```

Expected: no errors.

---

## Task 3: Create stub pages

**Files:**
- Create: `src/pages/AgendaPage.tsx`
- Create: `src/pages/PacientesPage.tsx`
- Create: `src/pages/SettingsPage.tsx`

- [ ] **Step 1: Create AgendaPage**

```tsx
export function AgendaPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
      <div className="bg-surface-container rounded-2xl p-8 max-w-md w-full mx-4 text-center space-y-3">
        <h2 className="font-display text-2xl font-semibold text-on-surface">Agenda</h2>
        <p className="text-on-surface-variant text-xs">En construcción</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create PacientesPage**

```tsx
export function PacientesPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
      <div className="bg-surface-container rounded-2xl p-8 max-w-md w-full mx-4 text-center space-y-3">
        <h2 className="font-display text-2xl font-semibold text-on-surface">Pacientes</h2>
        <p className="text-on-surface-variant text-xs">En construcción</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create SettingsPage**

```tsx
import { useAuth } from '../contexts/AuthContext'

export function SettingsPage() {
  const { profile } = useAuth()

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-surface-container rounded-2xl p-8 max-w-md w-full mx-4 text-center space-y-3">
        <h2 className="font-display text-2xl font-semibold text-on-surface">Settings</h2>
        <p className="text-on-surface-variant text-sm">Rol: {profile?.role}</p>
        <p className="text-on-surface-variant text-xs">En construcción</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build 2>&1 | grep "error"
```

Expected: no errors.

---

## Task 4: Register routes in App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add imports**

Add to the imports block (after existing page imports):

```tsx
import { AgendaPage } from './pages/AgendaPage'
import { PacientesPage } from './pages/PacientesPage'
import { SettingsPage } from './pages/SettingsPage'
```

- [ ] **Step 2: Add profesional sub-routes**

Inside the existing `<Route element={<ProfesionalLayout />}>` block, add the two new routes alongside the existing dashboard route:

```tsx
<Route element={<ProfesionalLayout />}>
  <Route path="/profesional/dashboard" element={<ProfesionalDashboard />} />
  <Route path="/profesional/agenda" element={<AgendaPage />} />
  <Route path="/profesional/pacientes" element={<PacientesPage />} />
</Route>
```

- [ ] **Step 3: Add universal settings route**

Inside `<Route element={<RequireAuth />}>`, after the two role-specific blocks, add:

```tsx
<Route path="/settings" element={<SettingsPage />} />
```

The full `RequireAuth` block should look like:

```tsx
<Route element={<RequireAuth />}>
  <Route element={<RoleAuth requiredRole="profesional" redirectTo="/client/dashboard" />}>
    <Route element={<ProfesionalLayout />}>
      <Route path="/profesional/dashboard" element={<ProfesionalDashboard />} />
      <Route path="/profesional/agenda" element={<AgendaPage />} />
      <Route path="/profesional/pacientes" element={<PacientesPage />} />
    </Route>
  </Route>

  <Route element={<RoleAuth requiredRole="client" redirectTo="/profesional/dashboard" />}>
    <Route element={<ClientLayout />}>
      <Route path="/client/dashboard" element={<ClientDashboard />} />
    </Route>
  </Route>

  <Route path="/settings" element={<SettingsPage />} />
</Route>
```

- [ ] **Step 4: Final build check**

```bash
npm run build 2>&1
```

Expected: `✓ built in` with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/AppSidebar.tsx src/pages/AgendaPage.tsx src/pages/PacientesPage.tsx src/pages/SettingsPage.tsx src/layouts/ProfesionalLayout.tsx src/App.tsx
git commit -m "feat: add sidebar to profesional layout with agenda, pacientes, and settings routes"
```
