import { Component, ChangeDetectionStrategy, Output, EventEmitter, Input } from '@angular/core';

@Component({
  selector: 'app-cashier-action-bar',
  standalone: true,
  templateUrl: './action-bar.component.html',
  styleUrls: ['./action-bar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActionBarComponent {
  @Input() draftsCount = 0;

  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() toggleRightSidebar = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
  @Output() saveAndPrint = new EventEmitter<void>();
  @Output() print = new EventEmitter<void>();
  @Output() new = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() return = new EventEmitter<void>();
  @Output() drafts = new EventEmitter<void>();
}
