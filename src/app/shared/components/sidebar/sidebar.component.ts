import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @Input() expanded = false;
  @Output() toggle = new EventEmitter<void>();

  navItems = [
    { label: 'الكاشير', icon: 'point_of_sale', route: '/pos/cashier' },
    { label: 'إدارة المخزون', icon: 'inventory_2', route: '/pos/products' },
    { label: 'تقارير المبيعات', icon: 'bar_chart', route: '/pos/receipts' },
    { label: 'أدوات الطباعة', icon: 'print', route: '/pos/receipt-form' },
    { label: 'الإعدادات', icon: 'settings', route: '#' }
  ];

  @HostListener('document:keydown.escape', ['$event'])
  handleEscape(event: KeyboardEvent) {
    if (this.expanded) {
      this.toggle.emit();
    }
  }

  onClose() {
    if (this.expanded) {
      this.toggle.emit();
    }
  }

  onSelectNavItem() {
    if (window.innerWidth < 1024 && this.expanded) {
      this.toggle.emit();
    }
  }
}
