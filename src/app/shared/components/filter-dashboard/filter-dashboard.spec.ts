import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterDashboard } from './filter-dashboard';

describe('FilterDashboard', () => {
  let component: FilterDashboard;
  let fixture: ComponentFixture<FilterDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilterDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
