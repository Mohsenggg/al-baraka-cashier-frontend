import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FloatingDropdownComponent } from './floating-dropdown.component';

describe('FloatingDropdownComponent', () => {
  let component: FloatingDropdownComponent;
  let fixture: ComponentFixture<FloatingDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FloatingDropdownComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FloatingDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
