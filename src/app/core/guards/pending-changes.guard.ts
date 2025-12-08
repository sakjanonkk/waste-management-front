import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Observable, of } from 'rxjs';

// Lightweight interface so we don't alter form component logic
export interface CanComponentDeactivate {
  hasPendingChanges: () => boolean;
}

@Injectable({ providedIn: 'root' })
export class PendingChangesGuard implements CanDeactivate<CanComponentDeactivate> {
  canDeactivate(component: CanComponentDeactivate): Observable<boolean> | boolean {
    try {
      const dirty = component?.hasPendingChanges?.() ?? false;
      if (!dirty) return true;
      const confirmLeave = window.confirm('คุณมีการแก้ไขที่ยังไม่บันทึก ต้องการออกจากหน้านี้หรือไม่?');
      return confirmLeave;
    } catch {
      return true;
    }
  }
}
