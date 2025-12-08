//โครงสร้างข้อมูลที่ API https://api.chnwt.dev/thai-oil-api/latest ส่งกลับมา
export interface FuelPriceResponse {
  status: string;
  response: {
    note: string;
    date: string;
    stations: {
      [stationName: string]: FuelStation;
    };
  };
}

//
export interface FuelStation {
  [fuelType: string]: FuelItem;
}

// ข้อมูลราคาน้ำมันเฉลี่ยแต่ละประเภท (น่าจะได้ใช้อันนี้มากกว่าเเยกตาม สถานี)
export interface AverageFuelPrices {
  gasohol_95: number;
  gasoline_95: number;
  diesel: number;
  premium_diesel: number;
  lpg: number;
  ngv: number;
}

// ข้อมูลน้ำมันแต่ละประเภท
export interface FuelItem {
  name: string;
  price: string;
}

// ก็บข้อมูลพร้อมเวลา เพื่อเช็ค cache เผื่อจะได้ไม่ต้องเรียก API บ่อยๆ 
export interface CachedFuelPrice {
  prices: FuelPriceResponse;
  timestamp: number;
}


