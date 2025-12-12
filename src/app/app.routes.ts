import { Routes } from '@angular/router';
// import { AuthGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './core/layouts/main-layout/main-layout.component';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'login',
	},
	{
		path: 'login',
		loadComponent: () => import('./features/auth/login/login').then(m => m.Login),
	},
	{
		path: '',
		component: MainLayoutComponent,
		children: [
			{
				path: 'home',
				// canActivate: [AuthGuard],
				loadComponent: () => import('./features/home/home.page.component').then(m => m.HomePageComponent),
			},
			{
				path: 'staff',
				// canActivate: [AuthGuard],
				loadChildren: () => import('./features/staff/staff.routes').then(m => m.STAFF_ROUTES),
			},
			{
				path: 'vehicle',
				// canActivate: [AuthGuard],
				loadChildren: () => import('./features/vehicle/vehicle.routes').then(m => m.VEHICLE_ROUTES),
			},
			{
				path: 'collection-point',
				// canActivate: [AuthGuard],
				loadChildren: () => import('./features/collection-point/collection-point.routes').then(m => m.COLLECTION_POINT_ROUTES),
			},
			{
				path: 'daily-route',
				// canActivate: [AuthGuard],
				loadComponent: () =>
					import('./features/daily-route/daily-route.page.component').then(m => m.DailyRoutePageComponent),
			},
		]
	},
	{
		path: '**',
		loadComponent: () =>
			import('./features/misc/not-found/not-found.component').then(m => m.NotFoundComponent),
	}
];
