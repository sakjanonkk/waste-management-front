import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    loadChildren: () => import('./features/auth/login/login.route').then((m) => m.LoginRoutes),
  },
  {
    path: 'vehicle',
    loadChildren: () => import('./features/vehicle/vehicle.route').then((m) => m.VehicleRoutes),
  },
  {
    path: 'staff',
    loadChildren: () => import('./features/staff/staff.route').then((m) => m.StaffRoutes),
  }
];
