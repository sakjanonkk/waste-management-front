import { Routes } from '@angular/router';

export const STAFF_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./staff-list/staff-list.page.component').then(
        (m) => m.StaffListPageComponent
      ),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./staff-form/staff-form.component').then(
        (m) => m.StaffFormPageComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./staff-detail/staff-detail.component').then(
        (m) => m.StaffDetailPageComponent
      ),
  },
  {
    path: ':id/edit',
    canDeactivate: [
      () =>
        import('../../core/guards/pending-changes.guard').then(
          (m) => m.PendingChangesGuard
        ),
    ],
    loadComponent: () =>
      import('./staff-form/staff-form.component').then(
        (m) => m.StaffFormPageComponent
      ),
  },
];
