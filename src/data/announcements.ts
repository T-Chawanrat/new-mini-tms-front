export type Announcement = {
  id: number;
  title: string;
  content: string;
  isPinned: boolean;
  publishedAt: string;
  startAt: string;
  endAt: string | null;
  imageUrls: string[];
};

export const announcementPreviewData: Announcement[] = [
  {
    id: 1,
    title: "แจ้งปรับเวลารับสินค้าในช่วงวันหยุด",
    content: "กรุณาตรวจสอบรอบรับสินค้าและวางแผนการจัดส่งล่วงหน้า เพื่อให้การให้บริการเป็นไปอย่างต่อเนื่อง หากมีรายการเร่งด่วน โปรดประสานงานกับเจ้าหน้าที่ก่อนเวลาตัดรอบ",
    isPinned: true,
    publishedAt: "10 ต.ค. 2569 09:00",
    startAt: "2026-10-10",
    endAt: "2026-10-14",
    imageUrls: [],
  },
  {
    id: 2,
    title: "แนวทางการส่งสินค้าช่วงฝนตก",
    content: "ตรวจสอบสภาพบรรจุภัณฑ์ แนบรูปสินค้า และตรวจสอบข้อมูลผู้รับก่อนออกจากคลังทุกครั้ง",
    isPinned: false,
    publishedAt: "9 ต.ค. 2569 14:30",
    startAt: "2026-10-09",
    endAt: null,
    imageUrls: [],
  },
  {
    id: 3,
    title: "แจ้งกำหนดการอบรมการใช้งานระบบ TMS",
    content: "ผู้ใช้งานใหม่สามารถลงทะเบียนเข้าร่วมการอบรมการใช้งานระบบรอบถัดไปได้ที่ฝ่าย IT",
    isPinned: false,
    publishedAt: "8 ต.ค. 2569 10:15",
    startAt: "2026-10-08",
    endAt: null,
    imageUrls: [],
  },
];
