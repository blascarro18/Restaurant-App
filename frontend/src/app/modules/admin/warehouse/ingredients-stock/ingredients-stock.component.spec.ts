import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IngredientsStockComponent } from './ingredients-stock.component';

describe('IngredientsStockComponent', () => {
  let component: IngredientsStockComponent;
  let fixture: ComponentFixture<IngredientsStockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IngredientsStockComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IngredientsStockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
