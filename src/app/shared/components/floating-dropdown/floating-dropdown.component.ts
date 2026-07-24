import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, HostListener, TemplateRef, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-floating-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './floating-dropdown.component.html',
  styleUrl: './floating-dropdown.component.css'
})
export class FloatingDropdownComponent implements OnInit, OnChanges {
  constructor(private cdr: ChangeDetectorRef) {}

  @Input() isOpen: boolean = false;
  @Input() trigger?: HTMLElement;
  @Input() options: any[] = [];
  @Input() displayKey: string = 'name';
  @Input() searchable: boolean = true;
  @Input() searchPlaceholder: string = 'بحث...';
  @Input() title?: string;
  @Input() titleIcon?: string;
  @Input() itemIcon?: string;
  @Input() addActionText?: string;
  @Input() emptyMessage: string = 'لا توجد بيانات';
  @Input() multiSelect: boolean = false;
  @Input() itemTemplate?: TemplateRef<any>;

  @Output() itemSelected = new EventEmitter<any>();
  @Output() addClicked = new EventEmitter<void>();
  @Output() closeDropdown = new EventEmitter<void>();

  @ViewChild('floatingPanel') floatingPanel?: ElementRef<HTMLElement>;

  searchTerm: string = '';
  filteredOptions: any[] = [];

  overlayStyle: Record<string, string> = {};
  placement: 'left' | 'right' = 'left';

  ngOnInit(): void {
    this.filteredOptions = this.options;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] || changes['searchTerm']) {
      this.filterOptions();
    }
    if (changes['isOpen'] && this.isOpen) {
      this.searchTerm = '';
      this.filterOptions();
      setTimeout(() => this.positionOverlay(), 0);
    }
  }

  filterOptions(): void {
    if (!this.searchTerm.trim()) {
      this.filteredOptions = this.options;
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.filteredOptions = this.options.filter(item => {
      const val = item[this.displayKey];
      return val && String(val).toLowerCase().includes(term);
    });
  }

  onSelect(item: any, event: MouseEvent): void {
    event.stopPropagation();
    this.itemSelected.emit(item);
    if (!this.multiSelect) {
      this.close();
    }
  }

  onAdd(event: MouseEvent): void {
    event.stopPropagation();
    this.addClicked.emit();
  }

  close(): void {
    this.closeDropdown.emit();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.isOpen) {
      this.positionOverlay();
    }
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(): void {
    if (this.isOpen) {
      this.positionOverlay();
    }
  }

  private positionOverlay(): void {
    if (!this.trigger) return;

    const rect = this.trigger.getBoundingClientRect();
    const panelEl = this.floatingPanel?.nativeElement;
    if (!panelEl) return;

    const pad = 16;
    const gap = 24;
    const width = 320;
    const height = panelEl.offsetHeight || 300;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let placement: 'left' | 'right' = 'left';
    const spaceLeft = rect.left - pad;
    const spaceRight = vw - rect.right - pad;

    if (spaceLeft >= width + gap) {
      placement = 'left';
    } else if (spaceRight >= width + gap) {
      placement = 'right';
    } else if (spaceLeft > spaceRight) {
      placement = 'left';
    } else {
      placement = 'right';
    }

    let left = placement === 'left' ? rect.left - width - gap : rect.right + gap;
    left = Math.max(pad, Math.min(left, vw - width - pad));

    let top = rect.top + (rect.height / 2) - (height / 2);
    top = Math.max(pad, Math.min(top, vh - height - pad));

    let arrowY = rect.top + (rect.height / 2) - top;
    arrowY = Math.max(20, Math.min(arrowY, height - 20));

    this.overlayStyle = {
      top: `${top}px`,
      left: `${left}px`,
      width: `${width}px`,
      '--floating-arrow-y': `${arrowY}px`
    };
    this.placement = placement;
    this.cdr.detectChanges();
  }
}
