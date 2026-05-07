import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-confirm',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm.component.html',
  styleUrls: ['./confirm.component.css']
})
export class ConfirmComponent {
  confirmService = inject(ConfirmService);

  get show() {
    return this.confirmService.show();
  }

  get message() {
    return this.confirmService.message();
  }

  onConfirm() {
    this.confirmService.respond(true);
  }

  onCancel() {
    this.confirmService.respond(false);
  }
}
