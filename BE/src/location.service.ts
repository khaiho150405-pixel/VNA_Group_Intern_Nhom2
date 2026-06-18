import { Injectable } from '@nestjs/common';
import Response from 'src/commons/response';

@Injectable()
export class LocationService {
  // Using esgoo API as requested by the user
  private readonly baseUrl = 'https://esgoo.net/api-tinhthanh-new';

  async getProvinces() {
    try {
      const res = await fetch(`${this.baseUrl}/1/0.htm`);
      const data = await res.json();
      return Response.get(data.data || data);
    } catch (error: any) {
      throw Response.errorInternal(error.message);
    }
  }

  async getDistricts(provinceId: string) {
    try {
      const res = await fetch(`${this.baseUrl}/2/${provinceId}.htm`);
      const data = await res.json();
      return Response.get(data.data || data);
    } catch (error: any) {
      throw Response.errorInternal(error.message);
    }
  }

  async getWards(districtId: string) {
    try {
      const res = await fetch(`${this.baseUrl}/3/${districtId}.htm`);
      const data = await res.json();
      return Response.get(data.data || data);
    } catch (error: any) {
      throw Response.errorInternal(error.message);
    }
  }
}
