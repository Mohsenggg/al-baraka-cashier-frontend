import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface ToastNotification {
  id: number;
  message: string;
  type: NotificationType;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private _toasts = signal<ToastNotification[]>([]);
  public readonly toasts = this._toasts.asReadonly();
  
  private idCounter = 0;

  constructor() {}

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error');
  }

  warning(message: string): void {
    this.show(message, 'warning');
  }

  info(message: string): void {
    this.show(message, 'info');
  }

  private show(message: string, type: NotificationType): void {
    const id = ++this.idCounter;
    
    // Check if the exact same message is already there to prevent duplicates
    if (this._toasts().some(t => t.message === message && t.type === type)) {
      return;
    }

    const toast: ToastNotification = { id, message, type };
    this._toasts.update(toasts => [...toasts, toast]);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      this.dismiss(id);
    }, 4000);
  }

  dismiss(id: number): void {
    this._toasts.update(toasts => toasts.filter(t => t.id !== id));
  }
}
