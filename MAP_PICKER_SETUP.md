# Map Picker Feature Setup Guide

## ภาพรวม

ฟีเจอร์นี้เพิ่มความสามารถในการเลือกตำแหน่งบนแผนที่ (Google Maps) สำหรับหน้า Collection Point Form โดยคลิกบนแผนที่แล้วดึงข้อมูล latitude, longitude และที่อยู่มาใส่ในฟอร์มโดยอัตโนมัติ

## ไฟล์ที่สร้างขึ้นใหม่

### 1. Models

- `src/app/shared/models/geocoding.model.ts`
  - `GeocodingRequest`: Request model สำหรับ reverse geocoding
  - `GeocodingResponse`: Response model จาก Go backend
  - `LocationSelection`: Model สำหรับส่งข้อมูลตำแหน่งที่เลือก

### 2. Services

- `src/app/core/services/geocoding/geocoding.service.ts`
  - Service สำหรับเรียก Go Backend API `/api/v1/geocoding/reverse`
  - ใช้ HttpClient และ inject() ตามหลัก Angular 21

### 3. Components

- `src/app/shared/components/map-picker/map-picker.component.ts`
  - Standalone component สำหรับแสดง Google Maps ใน Dialog
  - ใช้ Signals สำหรับ state management (loading, selectedLocation)
  - รองรับการคลิกบนแผนที่และลากหมุด (draggable marker)

## ไฟล์ที่ถูกแก้ไข

### 1. collection-point-form.component.ts

เพิ่ม:

- Import `MatDialog`, `MapPickerComponent`, `LocationSelection`
- Method `openMapPicker()` สำหรับเปิด dialog
- Logic สำหรับรับค่าจาก dialog และอัปเดต form

### 2. collection-point-form.component.html

เพิ่ม:

- ปุ่ม "เลือกจากแผนที่" ข้างๆ ฟิลด์พิกัด
- Header section สำหรับ coordinates card

### 3. collection-point-form.component.scss

เพิ่ม:

- Styles สำหรับ `.coordinates-header`
- Styles สำหรับปุ่ม `.map-picker-btn`

### 4. src/index.html

เพิ่ม:

- Google Maps JavaScript API script tag

## การติดตั้งและตั้งค่า

### ขั้นตอนที่ 1: ตั้งค่า Google Maps API Key

1. **แก้ไข `src/index.html`**

   ```html
   <!-- เปลี่ยน YOUR_GOOGLE_MAPS_API_KEY เป็น API Key จริง -->
   <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_ACTUAL_API_KEY&libraries=places&language=th"></script>
   ```

2. **APIs ที่ต้องเปิดใช้งานใน Google Cloud Console:**
   - ✅ Maps JavaScript API
   - ✅ Geocoding API (สำหรับ Go backend)
   - ✅ Places API (สำหรับ Go backend)

### ขั้นตอนที่ 2: ตรวจสอบ Go Backend

1. **ตรวจสอบว่า Go backend รันอยู่:**

   ```powershell
   # ควรอยู่ที่ http://localhost:8080
   curl.exe http://localhost:8080/health
   ```

2. **ตรวจสอบ `.env` ของ Go backend:**
   ```env
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   PORT=8080
   ALLOWED_ORIGINS=http://localhost:4200
   ```

### ขั้นตอนที่ 3: ตรวจสอบ Angular proxy config

**ตรวจสอบ `proxy.conf.json`:**

```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true
  }
}
```

### ขั้นตอนที่ 4: รัน Angular development server

```powershell
# ใน workspace root
npm start
# หรือ
ng serve --proxy-config proxy.conf.json
```

## การใช้งาน

1. เปิดหน้า Collection Point Form (เพิ่มหรือแก้ไข)
2. ในส่วน "พิกัดตำแหน่ง" จะเห็นปุ่ม "เลือกจากแผนที่"
3. คลิกปุ่มจะเปิด Dialog แสดงแผนที่
4. คลิกบนแผนที่เพื่อปักหมุด
5. ระบบจะดึงข้อมูลจาก Go backend:
   - Latitude
   - Longitude
   - ที่อยู่เต็ม (จังหวัด, อำเภอ, ตำบล, รหัสไปรษณีย์)
   - ชื่อสถานที่ (ถ้ามี)
6. คลิก "ยืนยัน" เพื่อใส่ข้อมูลใน form

## หลักการทำงาน (Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                    Angular Frontend                          │
│                                                              │
│  ┌────────────────────┐         ┌──────────────────────┐   │
│  │ Collection Point   │         │   Map Picker         │   │
│  │      Form          │────────▶│   Component          │   │
│  │                    │ Dialog  │                      │   │
│  │ - openMapPicker()  │         │ - Signals state      │   │
│  │ - update form      │◀────────│ - Google Maps API    │   │
│  └────────────────────┘ Result  │ - Click handling     │   │
│                                  └──────────────────────┘   │
│                                           │                  │
│                                           │ HTTP POST        │
│                                           ▼                  │
│                              ┌────────────────────────┐     │
│                              │  Geocoding Service     │     │
│                              │  - reverseGeocode()    │     │
│                              └────────────────────────┘     │
└───────────────────────────────────┼──────────────────────────┘
                                    │ /api/v1/geocoding/reverse
                                    ▼
┌─────────────────────────────────────────────────────────────┐
│                       Go Backend                             │
│                                                              │
│  ┌──────────────┐    ┌────────────────┐   ┌──────────────┐│
│  │   Handler    │───▶│   Usecase      │──▶│ Repository   ││
│  │              │    │                │   │              ││
│  │ - Validate   │    │ - Business     │   │ - Call       ││
│  │ - Transform  │    │   Logic        │   │   Google API ││
│  └──────────────┘    └────────────────┘   └──────────────┘│
│                                                     │        │
└─────────────────────────────────────────────────────┼────────┘
                                                      │
                                                      ▼
                                          Google Maps Geocoding API
```

## หลัก Angular 21 ที่ใช้

1. **Signals-based Reactivity**

   - ใช้ `signal()` สำหรับ `loading`, `selectedLocation`
   - ไม่ใช้ `BehaviorSubject` หรือ manual change detection

2. **Standalone Components**

   - `MapPickerComponent` เป็น standalone component
   - Import dependencies ใน `imports: []` array

3. **inject() Function**

   - ใช้ `inject()` แทน constructor injection
   - เช่น: `private dialog = inject(MatDialog)`

4. **Modern Template Syntax**

   - ใช้ `@if`, `@else` แทน `*ngIf`
   - Template inline ใน component (สำหรับ map-picker)

5. **Zoneless-compatible**
   - ไม่พึ่งพา Zone.js automatic change detection
   - อัปเดต state ผ่าน Signal updates

## Testing

### ทดสอบ Go Backend API

```powershell
curl.exe -X POST http://localhost:8080/api/v1/geocoding/reverse `
  -H "Content-Type: application/json" `
  -d '{\"latitude\": 16.32428264693088, \"longitude\": 103.77142209297529}'
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "place_name": "ศูนย์​ส่งเสริม​การเรียนรู้​อำเภอโพธิ์ชัย",
    "address": "หมู่ 2 บ้านขามเปี้ย, ถนนจรจำรูญ, ตำบลขามเปี้ย อำเภอโพธิ์ชัย จังหวัดร้อยเอ็ด, 45230",
    "latitude": 16.32428264693088,
    "longitude": 103.77142209297529,
    "province": "ร้อยเอ็ด",
    "postal_code": "45230"
  }
}
```

## Troubleshooting

### ปัญหา: แผนที่ไม่โหลด

- ตรวจสอบว่าใส่ Google Maps API Key ใน `index.html` แล้ว
- เปิด Browser Console ดู error messages
- ตรวจสอบว่า API Key มีสิทธิ์เรียก Maps JavaScript API

### ปัญหา: ไม่สามารถดึงข้อมูลที่อยู่

- ตรวจสอบว่า Go backend รันอยู่ที่ port 8080
- ตรวจสอบ Network tab ว่า request ไป `/api/v1/geocoding/reverse` สำเร็จหรือไม่
- ตรวจสอบว่า Go backend เปิด Geocoding API และ Places API แล้ว

### ปัญหา: CORS Error

- ตรวจสอบว่า Go backend มี CORS middleware
- ตรวจสอบว่า `ALLOWED_ORIGINS` ใน `.env` รวม `http://localhost:4200`

### ปัญหา: Dialog ไม่เปิด

- ตรวจสอบว่า import `MatDialog` ใน component แล้ว
- ตรวจสอบ Browser Console หา error messages

## Security Notes

1. **API Key Protection:**

   - Frontend API Key (Maps JavaScript API) จะโชว์ใน browser - ควรจำกัด Referrers
   - Backend API Key (Geocoding, Places) ซ่อนอยู่ใน Go backend - ปลอดภัยกว่า

2. **Rate Limiting:**

   - ควรเพิ่ม rate limiting ใน Go backend เพื่อป้องกัน abuse
   - Google Maps APIs มี quota limits ต้องระวัง

3. **Input Validation:**
   - Go backend validate latitude (-90 ถึง 90) และ longitude (-180 ถึง 180)
   - Frontend validate ผ่าน Angular Validators

## Next Steps

1. **ปรับปรุง UX:**

   - เพิ่ม loading state ระหว่างดึงข้อมูล
   - แสดง error messages ถ้า geocoding ล้มเหลว
   - เพิ่ม search box บนแผนที่

2. **เพิ่มฟีเจอร์:**

   - Current location detection (geolocation API)
   - แสดงจุดเก็บขยะที่มีอยู่แล้วบนแผนที่
   - แสดงรัศมีความครอบคลุมของจุดเก็บขยะ

3. **Performance:**
   - Lazy load Google Maps script
   - Cache geocoding results
   - Debounce marker drag events

## References

- [Angular 21 Documentation](https://angular.dev)
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Go Backend Clean Architecture](./Google_API_referrence/go_backend_example/README.md)
