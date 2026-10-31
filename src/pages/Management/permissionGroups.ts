export const permissionGroups = [
  { name: "ข้อมูลวันนี้", codes: ["DASHBOARD", "MANAGE_ANNOUNCEMENTS"] },
  { name: "จัดการข้อมูลหลัก", codes: ["MANAGE_RECIPIENTS", "MANAGE_ROUTES", "CONTRACTOR_CREATE"] },
  { name: "จัดการบิล", codes: ["CREATE_RECEIVE", "IMPORT_RECEIVE", "RECEIVE_REPORT", "LABEL_PRINT", "DELIVERY_CLOSE", "DELIVERY_ISSUES"] },
  { name: "คลังสินค้าและขนส่ง", codes: ["WAREHOUSE_RECEIVE", "PRODUCT_WAREHOUSE", "PRODUCT_TRUCK", "TRUCK_LOAD", "TRUCK_DELIVERY", "DC_RECEIVE"] },
  { name: "รายงาน", codes: ["PENDING_REPORT_RECEIVE", "PENDING_REPORT_SN", "PENDING_REPORT_DT"] },
  { name: "Super Admin", codes: ["MANAGE_USERS", "MANAGE_CUSTOMERS", "MANAGE_VEHICLES", "MANAGE_SHIPPERS", "MANAGE_PACKAGES", "MANAGE_HOLIDAYS", "MOVE", "DELIVERY_CLOSE_MEDIA"] },
  { name: "Logs", codes: ["LOG_LABEL_PRINT", "LOG_PRODUCT_TRUCK", "LOG_DELIVERY_TRUCK", "LOG_PRODUCT_WAREHOUSE", "LOG_RECEIVE_CREATE", "LOG_RECEIVE_IMPORT"] },
  { name: "แผนที่", codes: ["MAP"] },
];
