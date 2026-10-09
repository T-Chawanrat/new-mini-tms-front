export type ShipperId = string | number;
export type ShipperStatusValue = "ACTIVE" | "INACTIVE";
export type ShipperYesNo = "Y" | "N" | string;

export type ShipperCustomer = { id: ShipperId; code?: string; name?: string };
export type ShipperAddressSearchRow = {
  subdistrict_id?: ShipperId;
  district_id?: ShipperId;
  province_id?: ShipperId;
  subdistrict_name?: string;
  district_name?: string;
  province_name?: string;
  zip_code?: string;
};

export type ShipperForm = {
  shipper_code: string;
  shipper_type_id: string;
  shipper_name: string;
  address: string;
  subdistrict_id: string;
  district_id: string;
  province_id: string;
  subdistrict_name: string;
  district_name: string;
  province_name: string;
  zip_code: string;
  tel: string;
  fax: string;
};

export type ShipperRow = {
  shipper_id: ShipperId;
  shipper_code?: string;
  shipper_type_id?: ShipperId | string;
  shipper_name?: string;
  address?: string;
  subdistrict_id?: ShipperId | string;
  district_id?: ShipperId | string;
  province_id?: ShipperId | string;
  subdistrict_name?: string;
  district_name?: string;
  province_name?: string;
  zip_code?: string;
  tel?: string;
  fax?: string;
  is_deleted?: ShipperYesNo;
};

export type ShipperGridRow = ShipperRow & { id: ShipperId; no: number };
export type ROImage = { ro_image_id?: ShipperId; image_url: string; image_order?: number };
export type RORow = { ro_code_id: ShipperId; ro_code?: string; ro_name?: string; images?: ROImage[] };
export type ROGridRow = RORow & { id: ShipperId; no: number; image_count: number };
export type ShipperSelectedStatus = { shipper_id: ShipperId; current: ShipperStatusValue };
