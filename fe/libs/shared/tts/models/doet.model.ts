export interface KeyValue {
  key: any;
  value: string;
}

export interface LoaiHinhKinhDoanh {
  id: number;
  maloaihinh: string;
  tenloaihinh: string;
  trangthai: string;
}

export interface BusinessLine {
  id: number;
  manganh: string;
  tennganh: string;
  cap: number;
  trangthai: string;
}

export interface FileAttachment {
  type: 'GPKD' | 'OTHER';
  fileName: string;
  fileUrl: string;
  fileInfo?: string;
  // Used only on the client when the user picks a file before submit
  localFile?: File;
  mimeType?: string;
  size?: number;
}

export interface Doet {
  id?: number;
  name: string;
  name2?: string;
  taxCode: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
  loaiHinhKinhDoanh?: LoaiHinhKinhDoanh;
  businessLine?: BusinessLine;
  loaiHinhId?: number;
  businessLineId?: number;
  province?: KeyValue;
  ward?: KeyValue;
  district?: KeyValue;
  address?: string;
  gpkdDate?: string | Date | null;
  officePhone?: string;
  headOfEnterprise?: string;
  headPhone?: string;
  operatingAddress?: string;
  operatingWard?: KeyValue;
  operatingDistrict?: KeyValue;
  operatingProvince?: KeyValue;
  attachments?: FileAttachment[];
}

export interface DoetFilters {
  name?: string;
  taxCode?: string;
  loaiHinhId?: number;
  businessLineId?: number;
  wardId?: string;
  status?: string;
  page?: number;
  limit?: number;
}
