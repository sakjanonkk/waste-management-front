import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { VehicleListPage } from './vehicle-list.page';
import { VehicleService } from '../../../core/services/vehicle/vehicle.service';

describe('VehicleListPage', () => {
  let component: VehicleListPage;
  let fixture: ComponentFixture<VehicleListPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleListPage, RouterTestingModule],
      providers: [
        {
          provide: VehicleService,
          useValue: {
            list: () => of({ success: true, data: [], total: 0 }),
            delete: () => of({}),
          },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
