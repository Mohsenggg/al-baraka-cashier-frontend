import { Injectable, signal } from '@angular/core';

export interface ProductAttributeOption {
  id: number;
  name: string;
}

export interface NamedEntity {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class ProductReferenceDataService {
  private readonly attributesSignal = signal<ProductAttributeOption[]>([
    { id: 1, name: 'اللون' },
    { id: 2, name: 'الوزن' },
    { id: 3, name: 'الرائحة' },
    { id: 4, name: 'الخامة' },
    { id: 5, name: 'المقاس' },
    { id: 6, name: 'الماركة' }
  ]);

  private readonly categoriesSignal = signal<NamedEntity[]>([
    { id: 1, name: 'الكترونيات' },
    { id: 2, name: 'منظفات' },
    { id: 3, name: 'مواد غذائية' }
  ]);

  private readonly manufacturersSignal = signal<NamedEntity[]>([
    { id: 1, name: 'شركة أ' },
    { id: 2, name: 'شركة ب' }
  ]);

  private readonly suppliersSignal = signal<NamedEntity[]>([
    { id: 1, name: 'مورد 1' },
    { id: 2, name: 'مورد 2' },
    { id: 3, name: 'مورد 3' }
  ]);

  readonly attributes = this.attributesSignal.asReadonly();
  readonly categories = this.categoriesSignal.asReadonly();
  readonly manufacturers = this.manufacturersSignal.asReadonly();
  readonly suppliers = this.suppliersSignal.asReadonly();

  addCategory(name: string): NamedEntity {
    const newItem = { id: this.generateId(), name };
    this.categoriesSignal.update(list => [...list, newItem]);
    return newItem;
  }

  addManufacturer(name: string): NamedEntity {
    const newItem = { id: this.generateId(), name };
    this.manufacturersSignal.update(list => [...list, newItem]);
    return newItem;
  }

  addSupplier(name: string): NamedEntity {
    const newItem = { id: this.generateId(), name };
    this.suppliersSignal.update(list => [...list, newItem]);
    return newItem;
  }

  addAttributeOption(name: string): ProductAttributeOption {
    const newItem = { id: this.generateId(), name };
    this.attributesSignal.update(list => [...list, newItem]);
    return newItem;
  }

  private generateId(): number {
    return Math.floor(Math.random() * 1000) + 10;
  }
}
