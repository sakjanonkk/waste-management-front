import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
    private http = inject(HttpClient);

    // Signal to hold current user data
    myUserData = signal<any | null>(null);

    getUserMe() {
        // Always use relative path to let proxy handle the backend routing
        return this.http.get<any>('/api/v1/users/me');
    }
}
