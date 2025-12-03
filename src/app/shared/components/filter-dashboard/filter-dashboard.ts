import { Component, EventEmitter, Output } from '@angular/core';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatOption, MatSelect } from '@angular/material/select';
export interface FilterData {
  academicYear: string;
  semester: number | null;
  region: string;
  province: string;
  university: string;
}
@Component({
  selector: 'app-filter-dashboard',
  imports: [
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    MatIcon,
    MatButtonModule,
  ],
  templateUrl: './filter-dashboard.html',
  styleUrl: './filter-dashboard.scss',
})
export class FilterDashboard {
  @Output() filterChange = new EventEmitter<FilterData>();
  @Output() clearFilter = new EventEmitter<void>();

  selectedAcademicYear: string = '2566';
  selectedSemester: number | null = 1;
  selectedRegion: string = '';
  selectedProvince: string = '';
  selectedUniversity: string = '';

  academicYears: string[] = ['2566', '2565', '2564', '2563', '2562'];

  semesters: { value: number; label: string }[] = [
    { value: 1, label: '1' },
    { value: 2, label: '2' },
  ];

  regions: { value: string; label: string }[] = [
    { value: '', label: 'ทั้งหมด' },
    { value: 'north', label: 'ภาคเหนือ' },
    { value: 'northeast', label: 'ภาคตะวันออกเฉียงเหนือ' },
    { value: 'central', label: 'ภาคกลาง' },
    { value: 'east', label: 'ภาคตะวันออก' },
    { value: 'west', label: 'ภาคตะวันตก' },
    { value: 'south', label: 'ภาคใต้' },
  ];

  provinces: { value: string; label: string }[] = [
    { value: '', label: 'ทั้งหมด' },
    { value: 'bangkok', label: 'กรุงเทพมหานคร' },
    { value: 'khonkaen', label: 'ขอนแก่น' },
    { value: 'chiangmai', label: 'เชียงใหม่' },
    { value: 'phuket', label: 'ภูเก็ต' },
    { value: 'songkhla', label: 'สงขลา' },
  ];

  universities: { value: string; label: string }[] = [
    { value: '', label: 'ทั้งหมด' },
    { value: 'chula', label: 'จุฬาลงกรณ์มหาวิทยาลัย' },
    { value: 'mahidol', label: 'มหาวิทยาลัยมหิดล' },
    { value: 'kku', label: 'มหาวิทยาลัยขอนแก่น' },
    { value: 'cmu', label: 'มหาวิทยาลัยเชียงใหม่' },
    { value: 'psu', label: 'มหาวิทยาลัยสงขลานครินทร์' },
  ];

  onFilterChange() {
    const filterData: FilterData = {
      academicYear: this.selectedAcademicYear,
      semester: this.selectedSemester,
      region: this.selectedRegion,
      province: this.selectedProvince,
      university: this.selectedUniversity,
    };
    this.filterChange.emit(filterData);
  }

  onClearFilter() {
    this.selectedAcademicYear = '2566';
    this.selectedSemester = 1;
    this.selectedRegion = '';
    this.selectedProvince = '';
    this.selectedUniversity = '';

    this.clearFilter.emit();
    this.onFilterChange();
  }

  onSemesterChange(semester: number) {
    this.selectedSemester =
      this.selectedSemester === semester ? null : semester;
    this.onFilterChange();
  }
}
