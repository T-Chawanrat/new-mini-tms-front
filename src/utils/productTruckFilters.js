const searchableFields = [
  "serial_id",
  "serial_no",
  "receive_code",
  "customer_name",
  "truck_code",
  "driver_name",
  "driver_username",
  "license_plate",
  "license_plate_province",
  "vehicle_model",
  "driver_type",
  "warehouse_name",
  "to_warehouse_name",
  "product_status",
  "truck_status",
  "created_name",
];

export const filterProductTruckRows = (rows, search) => {
  const keyword = String(search || "").trim().toLowerCase();
  if (!keyword) return rows;

  return rows.filter((row) =>
    searchableFields.some((field) => {
      const value = row[field];
      return value !== null && value !== undefined && String(value).toLowerCase().includes(keyword);
    }),
  );
};
