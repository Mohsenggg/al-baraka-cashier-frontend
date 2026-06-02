import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductsMainPageComponent } from './products-main-page.component';

describe('ProductsMainPageComponent', () => {
  let component: ProductsMainPageComponent;
  let fixture: ComponentFixture<ProductsMainPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductsMainPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductsMainPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
