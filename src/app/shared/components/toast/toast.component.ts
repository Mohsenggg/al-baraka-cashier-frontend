import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, ToastNotification } from '../../services/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css']
})
export class ToastComponent {
  notificationService = inject(NotificationService);

  get toasts() {
    return this.notificationService.toasts();
  }

  dismiss(id: number) {
    this.notificationService.dismiss(id);
  }
}
