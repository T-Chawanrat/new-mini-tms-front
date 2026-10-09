export type RouteRow = {
  route_id: number;
  warehouse_id: number | null;
  warehouse_name: string | null;
  route_code: string | null;
  route_name: string | null;
  cost_oil: string | number | null;
  is_deleted: "Y" | "N";
  route_detail_id: number | null;
  subdistrict_id: number | null;
  subdistrict_name: string | null;
  district_name: string | null;
  province_name: string | null;
  zip_code: string | null;
  route_detail_day_id: number | null;
  day: string | null;
};

export type RouteDetail = {
  route_detail_id: number;
  subdistrict_id: number | null;
  subdistrict_name: string | null;
  district_name: string | null;
  province_name: string | null;
  zip_code: string | null;
  days: string[];
};

export type RouteItem = Omit<RouteRow, "route_detail_id" | "subdistrict_id" | "subdistrict_name" | "district_name" | "province_name" | "zip_code" | "route_detail_day_id" | "day"> & {
  details: RouteDetail[];
};

export type RouteWarehouse = { id: number; name: string };
export type RouteStatusTarget = { route_id: number; is_deleted: "Y" | "N" };
export type DeleteRouteDetailTarget = { route_detail_id: number; subdistrict_name: string | null };
