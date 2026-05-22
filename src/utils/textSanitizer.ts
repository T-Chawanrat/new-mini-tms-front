// remove all spaces from the input
export const removeSpaces = (value: string) => {
  return value.replace(/\s/g, "");
};

// input ทั่วไปที่เป็น code เช่น username, employee_code, license_no
// อนุญาต: อังกฤษ, ตัวเลข, underscore, dash
export const cleanCodeInput = (value: string) => {
  return removeSpaces(value).replace(/[^a-zA-Z0-9_-]/g, "");
};

// Name input
export const cleanNameInput = (value: string) => {
  return removeSpaces(value).replace(/[^ก-๙a-zA-Z]/g, "");
};

// Number input
export const cleanNumberInput = (value: string) => {
  return removeSpaces(value).replace(/\D/g, "");
};

// email
export const cleanEmailInput = (value: string) => {
  return removeSpaces(value).replace(/[^a-zA-Z0-9@._+-]/g, "");
};