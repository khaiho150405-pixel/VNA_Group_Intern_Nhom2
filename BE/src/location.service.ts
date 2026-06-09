import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Response from 'src/commons/response';

@Injectable()
export class LocationService {
  private readonly baseUrl = 'https://dev-online-gateway.ghn.vn/shiip/public-api/master-data';

  constructor(private readonly configService: ConfigService) {}

  private async fetchGhn(endpoint: string, queryParams: Record<string, any> = {}) {
    const token = this.configService.get<string>('ghnToken');
    if (!token) {
      throw Response.errorInternal('GHN Token is not configured in .env');
    }

    try {
      const queryString = new URLSearchParams(queryParams).toString();
      const url = queryString ? `${this.baseUrl}${endpoint}?${queryString}` : `${this.baseUrl}${endpoint}`;
      
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Token': token,
        },
      });
      const data = await res.json();
      if (data.code !== 200) {
        throw new Error(data.message || 'Error fetching GHN API');
      }
      return Response.get(data.data);
    } catch (error: any) {
      throw Response.errorInternal(error.message);
    }
  }

  async getProvinces() {
    return this.fetchGhn('/province');
  }

  async getDistricts(provinceId: number) {
    return this.fetchGhn('/district', { province_id: provinceId });
  }

  async getWards(districtId: number) {
    return this.fetchGhn('/ward', { district_id: districtId });
  }
}