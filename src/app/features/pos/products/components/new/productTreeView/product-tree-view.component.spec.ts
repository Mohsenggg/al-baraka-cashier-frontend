import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductTreeViewComponent } from './product-tree-view.component';
import { RouterTestingModule } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('ProductTreeViewComponent', () => {
      let component: ProductTreeViewComponent;
      let fixture: ComponentFixture<ProductTreeViewComponent>;

      beforeEach(async () => {
            await TestBed.configureTestingModule({
                  imports: [ProductTreeViewComponent, RouterTestingModule],
                  providers: [
                        provideHttpClient(),
                        provideHttpClientTesting()
                  ]
            }).compileComponents();

            fixture = TestBed.createComponent(ProductTreeViewComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
      });

      it('should create the ProductTreeViewComponent', () => {
            expect(component).toBeTruthy();
      });

      it('should have initial mock categories loaded', () => {
            const data = component.treeData();
            expect(data.length).toBeGreaterThan(0);
            expect(component.stats().totalProducts).toBeGreaterThan(0);
      });

      it('should support categories with direct groups without brands (e.g. سوائل ومنظفات)', () => {
            const liquidsCategory = component.treeData().find(c => c.code === '08');
            expect(liquidsCategory).toBeDefined();
            expect(liquidsCategory?.brands.length).toBe(0);
            expect(liquidsCategory?.directGroups.length).toBeGreaterThan(0);
            const vanishGroup = liquidsCategory?.directGroups.find(g => g.code === '083');
            expect(vanishGroup?.brandId).toBeNull();
            expect(vanishGroup?.products.length).toBeGreaterThan(0);
      });

      it('should expand all nodes when expandAll() is called', () => {
            component.expandAll();
            const data = component.treeData();
            for (const cat of data) {
                  expect(cat.expanded).toBeTrue();
                  for (const b of cat.brands) {
                        expect(b.expanded).toBeTrue();
                        for (const g of b.groups) {
                              expect(g.expanded).toBeTrue();
                        }
                  }
                  for (const g of cat.directGroups) {
                        expect(g.expanded).toBeTrue();
                  }
            }
      });

      it('should collapse all nodes when collapseAll() is called', () => {
            component.collapseAll();
            const data = component.treeData();
            for (const cat of data) {
                  expect(cat.expanded).toBeFalse();
                  for (const b of cat.brands) {
                        expect(b.expanded).toBeFalse();
                        for (const g of b.groups) {
                              expect(g.expanded).toBeFalse();
                        }
                  }
                  for (const g of cat.directGroups) {
                        expect(g.expanded).toBeFalse();
                  }
            }
      });

      it('should filter tree when search query is entered', () => {
            component.searchQuery.set('لافندر');
            fixture.detectChanges();
            const filtered = component.filteredTree();
            expect(filtered.length).toBeGreaterThan(0);
            const ArielCat = filtered.find(c => c.name.includes('مساحيق'));
            expect(ArielCat).toBeDefined();
            expect(ArielCat?.expanded).toBeTrue();
      });

      it('should clear all filters when clearAllFilters() is called', () => {
            component.searchQuery.set('فانش');
            component.selectedCategoryId.set('2');
            component.selectedStockFilter.set('low');
            expect(component.hasActiveFilters()).toBeTrue();

            component.clearAllFilters();
            expect(component.searchQuery()).toBe('');
            expect(component.selectedCategoryId()).toBe('');
            expect(component.selectedStockFilter()).toBe('');
            expect(component.hasActiveFilters()).toBeFalse();
      });
});
