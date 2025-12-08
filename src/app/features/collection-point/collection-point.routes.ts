import { Routes } from '@angular/router';

export const COLLECTION_POINT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./collection-point-list/collection-point-list.page.component').then(
        (m) => m.CollectionPointListPageComponent
      ),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./collection-point-form/collection-point-form.component').then(
        (m) => m.CollectionPointFormComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./collection-point-detail/collection-point-detail.component').then(
        (m) => m.CollectionPointDetailComponent
      ),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./collection-point-form/collection-point-form.component').then(
        (m) => m.CollectionPointFormComponent
      ),
  },
];
