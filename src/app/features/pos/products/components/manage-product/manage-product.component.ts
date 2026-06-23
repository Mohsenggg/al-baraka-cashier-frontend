import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-manage-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './manage-product.component.html',
  styleUrl: './manage-product.component.css'
})
export class ManageProductComponent implements OnInit, OnDestroy {
  productForm!: FormGroup;
  activeTab: 'basic' | 'composition' = 'basic';
  generatedName: string = '';
  
  // Dummy Data
  availableAttributes = [
    { id: 1, name: 'اللون' },
    { id: 2, name: 'الوزن' },
    { id: 3, name: 'الرائحة' },
    { id: 4, name: 'الخامة' },
    { id: 5, name: 'المقاس' },
    { id: 6, name: 'الماركة' }
  ];

  categories = [
    { id: 1, name: 'الكترونيات' },
    { id: 2, name: 'منظفات' },
    { id: 3, name: 'مواد غذائية' }
  ];

  manufacturers = [
    { id: 1, name: 'شركة أ' },
    { id: 2, name: 'شركة ب' }
  ];

  suppliers = [
    { id: 1, name: 'مورد 1' },
    { id: 2, name: 'مورد 2' },
    { id: 3, name: 'مورد 3' }
  ];

  // UI State for dropdowns
  activeDropdown: 'attribute' | 'category' | 'manufacturer' | 'supplier' | null = null;
  dropdownSearchTerms = {
    attribute: '',
    category: '',
    manufacturer: '',
    supplier: ''
  };

  // Overlay state
  showOverlay: 'category' | 'manufacturer' | 'supplier' | null = null;

  activeAttributeIndex: number | null = null;

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.initForm();
    this.setupSubscriptions();
    
    // Initialize with one barcode row
    this.addBarcode();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm() {
    this.productForm = this.fb.group({
      baseName: ['', Validators.required],
      attributes: this.fb.array([]),
      barcodes: this.fb.array([]),
      categoryId: [null],
      manufacturerId: [null],
      supplierIds: [[]]
    });
  }

  get attributesFormArray() {
    return this.productForm.get('attributes') as FormArray;
  }

  get barcodesFormArray() {
    return this.productForm.get('barcodes') as FormArray;
  }

  setupSubscriptions() {
    this.productForm.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.updateGeneratedName();
    });
  }

  updateGeneratedName() {
    const baseName = this.productForm.get('baseName')?.value || '';
    const attrs = this.attributesFormArray.value
      .filter((a: any) => a.value)
      .map((a: any) => a.value)
      .join(' ');
    this.generatedName = `${baseName} ${attrs}`.trim();
  }

  // --- Attributes Management ---
  addAttribute(attr: {id: number, name: string}) {
    if (this.attributesFormArray.value.some((c: any) => c.name === attr.name)) {
      this.activeDropdown = null;
      return;
    }

    this.attributesFormArray.push(this.fb.group({
      id: [attr.id],
      name: [attr.name],
      value: ['']
    }));
    
    this.activeAttributeIndex = this.attributesFormArray.length - 1;
    this.activeDropdown = null;
  }

  removeAttribute(index: number) {
    this.attributesFormArray.removeAt(index);
    if (this.activeAttributeIndex === index) {
      this.activeAttributeIndex = null;
    } else if (this.activeAttributeIndex !== null && this.activeAttributeIndex > index) {
      this.activeAttributeIndex--;
    }
    this.updateGeneratedName();
  }

  selectAttribute(index: number) {
    this.activeAttributeIndex = index;
  }

  // --- Barcode Management ---
  addBarcode() {
    this.barcodesFormArray.push(this.fb.group({
      barcode: [''],
      sellingPrice: [0],
      buyingPrice: [0],
      stock: [0],
      isDefault: [false]
    }));
    
    if (this.barcodesFormArray.length === 1) {
      this.setDefaultBarcode(0);
    }
  }

  removeBarcode(index: number) {
    this.barcodesFormArray.removeAt(index);
    if (this.barcodesFormArray.length > 0 && !this.barcodesFormArray.value.some((c: any) => c.isDefault)) {
      this.setDefaultBarcode(0);
    }
  }

  setDefaultBarcode(index: number) {
    this.barcodesFormArray.controls.forEach((control, i) => {
      control.get('isDefault')?.setValue(i === index, {emitEvent: false});
    });
  }

  calculateProfitMargin(buying: number, selling: number): {value: number, percentage: number} {
    if (!buying || buying <= 0) return {value: 0, percentage: 0};
    const value = selling - buying;
    const percentage = (value / buying) * 100;
    return {value, percentage};
  }

  getTotalStock(): number {
    return this.barcodesFormArray.controls.reduce((sum, control) => {
      return sum + (Number(control.get('stock')?.value) || 0);
    }, 0);
  }

  // --- Dropdown Management ---
  toggleDropdown(type: 'attribute' | 'category' | 'manufacturer' | 'supplier') {
    if (this.activeDropdown === type) {
      this.activeDropdown = null;
    } else {
      this.activeDropdown = type;
      this.dropdownSearchTerms[type] = ''; 
    }
  }

  getFilteredList(type: 'attribute' | 'category' | 'manufacturer' | 'supplier') {
    const term = this.dropdownSearchTerms[type].toLowerCase();
    let list: any[] = [];
    switch (type) {
      case 'attribute': list = this.availableAttributes; break;
      case 'category': list = this.categories; break;
      case 'manufacturer': list = this.manufacturers; break;
      case 'supplier': list = this.suppliers; break;
    }
    if (!term) return list;
    return list.filter(item => item.name.toLowerCase().includes(term));
  }

  // --- Categorization Selections ---
  selectCategory(cat: any) {
    this.productForm.get('categoryId')?.setValue(cat.id);
    this.activeDropdown = null;
  }

  get selectedCategoryName() {
    const id = this.productForm.get('categoryId')?.value;
    return this.categories.find(c => c.id === id)?.name || 'اختر القسم...';
  }

  selectManufacturer(man: any) {
    this.productForm.get('manufacturerId')?.setValue(man.id);
    this.activeDropdown = null;
  }

  get selectedManufacturerName() {
    const id = this.productForm.get('manufacturerId')?.value;
    return this.manufacturers.find(m => m.id === id)?.name || 'اختر الشركة المصنعة...';
  }

  toggleSupplier(sup: any) {
    const control = this.productForm.get('supplierIds');
    const currentValues = control?.value as number[] || [];
    if (currentValues.includes(sup.id)) {
      control?.setValue(currentValues.filter(id => id !== sup.id));
    } else {
      control?.setValue([...currentValues, sup.id]);
    }
  }

  isSupplierSelected(sup: any): boolean {
    const currentValues = this.productForm.get('supplierIds')?.value as number[] || [];
    return currentValues.includes(sup.id);
  }

  get selectedSuppliers() {
    const ids = this.productForm.get('supplierIds')?.value as number[] || [];
    return this.suppliers.filter(s => ids.includes(s.id));
  }

  removeSupplier(id: number) {
    const control = this.productForm.get('supplierIds');
    const currentValues = control?.value as number[] || [];
    control?.setValue(currentValues.filter(v => v !== id));
  }

  // --- Overlays ---
  openOverlay(type: 'category' | 'manufacturer' | 'supplier') {
    this.showOverlay = type;
    this.activeDropdown = null;
  }

  closeOverlay() {
    this.showOverlay = null;
  }

  addNewItem(type: 'category' | 'manufacturer' | 'supplier', name: string) {
    if (!name) return;
    const newId = Math.floor(Math.random() * 1000) + 10;
    const newItem = { id: newId, name };

    if (type === 'category') {
      this.categories.push(newItem);
      this.selectCategory(newItem);
    } else if (type === 'manufacturer') {
      this.manufacturers.push(newItem);
      this.selectManufacturer(newItem);
    } else if (type === 'supplier') {
      this.suppliers.push(newItem);
      this.toggleSupplier(newItem);
    }
    
    this.closeOverlay();
  }
}
