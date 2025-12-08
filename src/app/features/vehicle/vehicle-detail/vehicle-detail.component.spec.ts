import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { VehicleDetailComponent } from './vehicle-detail.component';

describe('VehicleDetailComponent', () => {
  let component: VehicleDetailComponent;
  let fixture: ComponentFixture<VehicleDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleDetailComponent, RouterTestingModule],
      providers: [provideHttpClient()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
