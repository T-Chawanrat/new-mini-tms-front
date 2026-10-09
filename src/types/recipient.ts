export type Id = string | number;
export type YesNo = "Y" | "N" | string;

export type Customer = {
  id: Id;
  code?: string;
  name?: string;
};

export type RecipientType = {
  id: Id;
  name: string;
};

export type RecipientDetail = {
  recipient_detail_id: Id;
  recipient_detail_name?: string;
  address?: string;
  subdistrict_id?: Id | "";
  district_id?: Id | "";
  province_id?: Id | "";
  subdistrict_name?: string;
  district_name?: string;
  province_name?: string;
  zip_code?: string;
  tel1?: string;
  line_id?: string;
  longitude?: string | null;
  latitude?: string | null;
  detail_is_deleted?: YesNo;
};

export type ApiRecipientRow = {
  recipient_id?: Id;
  recipient_code?: string;
  recipient_type_id?: Id | "";
  recipient_type_name?: string;
  recipient_name?: string;
  customer_id?: Id;
  recipient_customer_id?: Id;
  customer_code?: string;
  customer_name?: string;
  recipient_is_deleted?: YesNo;
  address_count?: number | string;
  recipient_detail_id?: Id;
  recipient_detail_name?: string;
  address?: string;
  subdistrict_id?: Id | "";
  district_id?: Id | "";
  province_id?: Id | "";
  subdistrict_name?: string;
  district_name?: string;
  province_name?: string;
  zip_code?: string;
  tel1?: string;
  line_id?: string;
  longitude?: string | null;
  latitude?: string | null;
  detail_is_deleted?: YesNo;
};

export type Recipient = {
  recipient_id: Id;
  recipient_code?: string;
  recipient_type_id?: Id | "";
  recipient_type_name?: string;
  recipient_name?: string;
  customer_id?: Id;
  recipient_customer_id?: Id;
  customer_code?: string;
  customer_name?: string;
  recipient_is_deleted?: YesNo;
  address_count?: number;
  details: RecipientDetail[];
};

export type DisplayRow =
  | (Recipient & {
      id: string;
      rowType: "recipient";
    })
  | {
      id: string;
      rowType: "detail";
      recipient: Recipient;
    };

export type ModalMode = "createRecipient" | "editRecipient" | "createDetail" | "editDetail";

export type RecipientForm = {
  recipient_code: string;
  recipient_type_id: string;
  recipient_name: string;
  recipient_detail_id: string;
  recipient_detail_name: string;
  address: string;
  address_search: string;
  subdistrict_id: string;
  district_id: string;
  province_id: string;
  zip_code: string;
  tel1: string;
  line_id: string;
  longitude: string;
  latitude: string;
};

export type AddressSearchRow = {
  subdistrict_id?: Id;
  district_id?: Id;
  province_id?: Id;
  subdistrict_name?: string;
  district_name?: string;
  province_name?: string;
  zip_code?: string;
};

export type StatusValue = "ACTIVE" | "INACTIVE";

export type SelectedStatus = {
  recipient_id: Id;
  recipient_detail_id: Id;
  current: StatusValue;
};
