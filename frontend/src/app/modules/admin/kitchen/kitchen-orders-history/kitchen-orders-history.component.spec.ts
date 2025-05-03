import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KitchenOrdersHistoryComponent } from './kitchen-orders-history.component';

describe('KitchenOrdersHistoryComponent', () => {
  let component: KitchenOrdersHistoryComponent;
  let fixture: ComponentFixture<KitchenOrdersHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KitchenOrdersHistoryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(KitchenOrdersHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
