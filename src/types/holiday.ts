export type HolidayId = string | number;
export type HolidayActiveStatus = "Y" | "N";
export type HolidayStatusValue = "ACTIVE" | "INACTIVE";

export type Holiday = {
  id: HolidayId;
  holiday_date: string;
  holiday_name: string;
  remark: string | null;
  is_deleted?: HolidayActiveStatus;
  is_actived: HolidayActiveStatus;
  created_at?: string;
  updated_at?: string;
};

export type HolidayGridRow = Holiday & { no: number };
export type HolidayForm = { holiday_date: string; holiday_name: string; remark: string; is_actived: HolidayActiveStatus };
export type HolidaySelectedStatus = { id: HolidayId; current: HolidayStatusValue };
