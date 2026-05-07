import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cashier-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
  navItems = [
    { label: 'الكاشير', icon: '🛒', active: true },
    { label: 'إدارة المخزون', icon: '📦', active: false },
    { label: 'إدارة المشتريات', icon: '🛒', active: false },
    { label: 'تقارير المبيعات', icon: '📊', active: false },
    { label: 'أدوات الطباعة', icon: '🖨️', active: false },
    { label: 'الإعدادات', icon: '⚙️', active: false }
  ];
}
