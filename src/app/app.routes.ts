import { Routes } from '@angular/router';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { 
    path: 'login', 
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) 
  },
  { 
    path: 'student/dashboard', 
    loadComponent: () => import('./pages/student-dashboard/student-dashboard.component').then(m => m.StudentDashboardComponent),
    canActivate: [roleGuard],
    data: { roles: ['Estudiante'] }
  },
  { 
    path: 'docente/dashboard', 
    loadComponent: () => import('./pages/docente-dashboard/docente-dashboard.component').then(m => m.DocenteDashboardComponent),
    canActivate: [roleGuard],
    data: { roles: ['Docente'] }
  },
  { 
    path: 'admin/dashboard', 
    loadComponent: () => import('./pages/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [roleGuard],
    data: { roles: ['Admin'] }
  },
  { 
    path: '', 
    redirectTo: 'login', 
    pathMatch: 'full' 
  },
  { 
    path: '**', 
    redirectTo: 'login' 
  }
];
