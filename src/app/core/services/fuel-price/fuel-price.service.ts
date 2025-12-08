import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { 
  FuelPriceResponse, 
  CachedFuelPrice, 
  AverageFuelPrices,
  FuelStation 
} from '../../../shared/models/fuel-price.model';
import { 
  FUEL_API_URL, 
  CACHE_DURATION_MS, 
  FUEL_TYPE_MAPPING, 
  DEFAULT_FUEL_PRICES,
  PREFERRED_STATIONS 
} from '../../data/fuel-mapping.config';

@Injectable({
  providedIn: 'root'
})
export class FuelPriceService {
  private cache: CachedFuelPrice | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Get cached prices or fetch from API if cache expired
   * เช็คว่า cache ยังใช้ได้ไหม (isCacheValid())
    ถ้าใช้ได้ → ส่งข้อมูลจาก cache
    ถ้าหมดอายุ → เรียก fetchLatestPrices()
   */

  getCachedPrices(): Observable<AverageFuelPrices> {
    if (this.isCacheValid()) {
      return of(this.calculateAveragePrices(this.cache!.prices));
    }
    return this.fetchLatestPrices();
  }

  /**
   * Fetch latest fuel prices from API
   * เรียก API ดึงราคาน้ำมัน
    เก็บลง cache พร้อม timestamp
    คำนวณราคาเฉลี่ย (calculateAveragePrices())
    ถ้า API error → ใช้ราคา default
   */
  fetchLatestPrices(): Observable<AverageFuelPrices> {
    return this.http.get<FuelPriceResponse>(FUEL_API_URL).pipe(
      map((response) => {
        this.cache = {
          prices: response,
          timestamp: Date.now()
        };
        return this.calculateAveragePrices(response);
      }),
      catchError((error) => {
        console.error('Failed to fetch fuel prices:', error);
        return of(this.getDefaultPrices());
      })
    );
  }

  /**
   * Get fuel cost per km for a specific fuel category
   * เช่น // → ส่งกลับ 33.44 (ราคาดีเซลเฉลี่ย)
   * Steps;
   * รับ fuel_category จาก database ('GASOLINE', 'DIESEL')
    แปลงเป็น API format ('gasohol_95', 'diesel')
    ส่งกลับราคาเฉลี่ย
   */
  getPriceByFuelType(fuelCategory: string): Observable<number> {
    return this.getCachedPrices().pipe(
      map((prices) => {
        const fuelType = FUEL_TYPE_MAPPING[fuelCategory];
        if (fuelType && prices[fuelType as keyof AverageFuelPrices]) {
          return prices[fuelType as keyof AverageFuelPrices];
        }
        return DEFAULT_FUEL_PRICES[fuelType] || 30.0;
      })
    );
  }

  /**
   * Calculate average prices across stations
   * วนลูปแต่ละประเภทน้ำมัน (diesel, gasohol_95, ...)
    ดึงราคาจากหลายสถานี (ptt, bcp, shell, ...)
    คำนวณค่าเฉลี่ย
    ถ้าไม่มีข้อมูล → ใช้ราคา default
   */
  private calculateAveragePrices(response: FuelPriceResponse): AverageFuelPrices {
    const averages: any = {};
    const fuelTypes = Object.keys(DEFAULT_FUEL_PRICES);

    fuelTypes.forEach((fuelType) => {
      const prices: number[] = [];
      
      Object.entries(response.response.stations).forEach(([stationName, station]: [string, FuelStation]) => {
        if (PREFERRED_STATIONS.includes(stationName) && station[fuelType]) {
          const price = parseFloat(station[fuelType].price);
          if (!isNaN(price)) {
            prices.push(price);
          }
        }
      });

      averages[fuelType] = prices.length > 0
        ? prices.reduce((sum, price) => sum + price, 0) / prices.length
        : DEFAULT_FUEL_PRICES[fuelType];
    });

    return averages as AverageFuelPrices;
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(): boolean {
    if (!this.cache) return false;
    return Date.now() - this.cache.timestamp < CACHE_DURATION_MS;
  }

  /**
   * Get default prices as fallback
   */
  private getDefaultPrices(): AverageFuelPrices {
    return {
      gasohol_95: DEFAULT_FUEL_PRICES['gasohol_95'],
      gasoline_95: DEFAULT_FUEL_PRICES['gasoline_95'],
      diesel: DEFAULT_FUEL_PRICES['diesel'],
      premium_diesel: DEFAULT_FUEL_PRICES['premium_diesel'],
      lpg: DEFAULT_FUEL_PRICES['lpg'],
      ngv: DEFAULT_FUEL_PRICES['ngv'],
    };
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache = null;
  }
}
