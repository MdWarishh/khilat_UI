// src/app/services/guest.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GuestService {

  private readonly KEY = 'guest_id';

  // App start hote hi call karo — UUID milegi ya bann jaayegi
  getOrCreateGuestId(): string {
    let guestId = localStorage.getItem(this.KEY);
    if (!guestId) {
      guestId = this.generateUUID();
      localStorage.setItem(this.KEY, guestId);
    }
    return guestId;
  }

  getGuestId(): string | null {
    return localStorage.getItem(this.KEY);
  }

  // UUID v4 generator
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}