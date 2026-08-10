import test from "node:test";
import assert from "node:assert/strict";

import { filterProductTruckRows } from "./productTruckFilters.js";

const rows = [
  {
    product_truck_id: 1,
    serial_no: "SN-001",
    driver_name: "สมชาย ใจดี",
    license_plate: "70-5168",
  },
  {
    product_truck_id: 2,
    serial_no: "SN-002",
    driver_name: "อนันต์ ทดสอบ",
    license_plate: "71-8628",
  },
];

test("คืนทุกรายการเมื่อไม่ได้กรอกคำค้นหา", () => {
  assert.deepEqual(filterProductTruckRows(rows, ""), rows);
});

test("ค้นหาสินค้าในรถจาก Serial No หรือทะเบียนรถได้", () => {
  assert.deepEqual(filterProductTruckRows(rows, "sn-002"), [rows[1]]);
  assert.deepEqual(filterProductTruckRows(rows, "70-5168"), [rows[0]]);
});
