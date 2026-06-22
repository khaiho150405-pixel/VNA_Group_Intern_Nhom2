/**
 * Address / Location API services fetching from esgoo.
 */
export const locationService = {
  /**
   * Fetch all Vietnam provinces
   */
  getProvinces: async (): Promise<any> => {
    const res = await fetch('https://esgoo.net/api-tinhthanh-new/1/0.htm');
    return res.json();
  },

  /**
   * Fetch districts in a province
   */
  getDistricts: async (provinceId: string): Promise<any> => {
    const res = await fetch(`https://esgoo.net/api-tinhthanh-new/2/${provinceId}.htm`);
    return res.json();
  },

  /**
   * Fetch wards in a district
   */
  getWards: async (districtId: string): Promise<any> => {
    const res = await fetch(`https://esgoo.net/api-tinhthanh-new/3/${districtId}.htm`);
    return res.json();
  }
};
