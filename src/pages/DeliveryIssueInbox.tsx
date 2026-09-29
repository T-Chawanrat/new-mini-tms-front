import { useMemo, useRef, useState } from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { CheckCircle2, FileText, ImagePlus, Search, Send } from "lucide-react";

type IssueStatus = "OPEN" | "RESOLVED";
type Issue = {
  id: number;
  title: string;
  receiveCode: string;
  truckCode: string;
  recipient: string;
  driver: string;
  preview: string;
  updatedAt: string;
  unread: number;
  status: IssueStatus;
};
type Attachment = { name: string; type: "image" | "file"; url?: string };
type Message = { id: number; by: "driver" | "admin"; name: string; body: string; time: string; attachment?: Attachment };

const starterIssues: Issue[] = [
  {
    id: 1,
    title: "ผู้รับขอเลื่อนวันจัดส่ง",
    receiveCode: "DO-260924-00128",
    truckCode: "DT-260924-0002",
    recipient: "บริษัท ไทยสยามอิเล็กทรอนิกส์ จำกัด",
    driver: "มานะ ทองดี",
    preview: "ผู้รับขอเลื่อนเป็นพรุ่งนี้ช่วงเช้าครับ",
    updatedAt: "10:42",
    unread: 2,
    status: "OPEN",
  },
  {
    id: 2,
    title: "ไม่พบผู้รับตามที่อยู่",
    receiveCode: "DO-260924-00131",
    truckCode: "DT-260924-0004",
    recipient: "หจก. เจริญทรัพย์",
    driver: "สมชาย ใจดี",
    preview: "โทรติดต่อผู้รับไม่ได้ครับ",
    updatedAt: "09:18",
    unread: 1,
    status: "OPEN",
  },
  {
    id: 3,
    title: "พัสดุมีรอยบุบเล็กน้อย",
    receiveCode: "DO-260923-00987",
    truckCode: "DT-260923-0011",
    recipient: "บริษัท เอส.พี. ออโต้พาร์ท จำกัด",
    driver: "วิชัย แก้วดี",
    preview: "รับทราบและแนบรูปเข้าระบบแล้ว",
    updatedAt: "เมื่อวาน",
    unread: 0,
    status: "RESOLVED",
  },
  {
    id: 4,
    title: "ขอเปลี่ยนจุดรับสินค้า",
    receiveCode: "DO-260923-00972",
    truckCode: "DT-260923-0009",
    recipient: "ร้านรุ่งเรืองวัสดุก่อสร้าง",
    driver: "ประเสริฐ บุญมา",
    preview: "รอยืนยันพิกัดใหม่จากผู้รับ",
    updatedAt: "เมื่อวาน",
    unread: 0,
    status: "OPEN",
  },
];
const starterMessages: Record<number, Message[]> = {
  1: [
    { id: 1, by: "driver", name: "มานะ ทองดี", body: "ผู้รับขอเลื่อนเป็นพรุ่งนี้ช่วงเช้าครับ รบกวนตรวจสอบให้ด้วยครับ", time: "10:42" },
    { id: 2, by: "admin", name: "กมลวรรณ", body: "รับทราบค่ะ ขอเช็กตารางรถและยืนยันนัดหมายให้นะคะ", time: "10:47" },
    { id: 3, by: "driver", name: "มานะ ทองดี", body: "ผู้รับยืนยันสะดวกรับ 09:00–11:00 น. ครับ", time: "10:51" },
  ],
  2: [{ id: 4, by: "driver", name: "สมชาย ใจดี", body: "ถึงสถานที่แล้ว แต่ไม่พบผู้รับตามที่อยู่และโทรติดต่อไม่ได้ครับ", time: "09:18" }],
  3: [
    {
      id: 5,
      by: "driver",
      name: "วิชัย แก้วดี",
      body: "พบรอยบุบเล็กน้อยที่กล่องด้านนอกครับ",
      time: "15:10",
      attachment: { name: "delivery-photo.jpg", type: "image" },
    },
    { id: 6, by: "admin", name: "กมลวรรณ", body: "รับทราบและแนบรูปเข้าระบบแล้ว ขอบคุณค่ะ", time: "15:17" },
  ],
  4: [{ id: 7, by: "driver", name: "ประเสริฐ บุญมา", body: "ผู้รับขอเปลี่ยนจุดรับสินค้า รอยืนยันพิกัดใหม่ครับ", time: "13:24" }],
};

const StatusChip = ({ value }: { value: IssueStatus }) => (
  <Chip
    label={value === "OPEN" ? "กำลังดำเนินการ" : "ปิดเรื่องแล้ว"}
    size="small"
    color={value === "OPEN" ? "warning" : "success"}
    variant="outlined"
    sx={{ height: 23, fontSize: 11, fontWeight: 700 }}
  />
);

export default function DeliveryIssueInbox() {
  const [issues, setIssues] = useState(starterIssues);
  const [messages, setMessages] = useState(starterMessages);
  const [selectedId, setSelectedId] = useState(1);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<Attachment>();
  const uploadRef = useRef<HTMLInputElement>(null);
  const selected = issues.find((item) => item.id === selectedId) ?? issues[0];
  const matchedIssues = useMemo(() => {
    const term = query.trim().toLowerCase();
    return !term
      ? issues
      : issues.filter((item) =>
          [item.title, item.receiveCode, item.truckCode, item.recipient, item.driver].some((value) => value.toLowerCase().includes(term)),
        );
  }, [issues, query]);
  const openIssue = (id: number) => {
    setSelectedId(id);
    setIssues((items) => items.map((item) => (item.id === id ? { ...item, unread: 0 } : item)));
  };
  const send = () => {
    const body = draft.trim();
    if (!body && !attachment) return;
    const message: Message = {
      id: Date.now(),
      by: "admin",
      name: "กมลวรรณ",
      body,
      attachment,
      time: new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()),
    };
    setMessages((items) => ({ ...items, [selected.id]: [...(items[selected.id] || []), message] }));
    setIssues((items) =>
      items.map((item) => (item.id === selected.id ? { ...item, preview: body || `แนบไฟล์: ${attachment?.name}`, updatedAt: "เมื่อสักครู่" } : item)),
    );
    setDraft("");
    setAttachment(undefined);
  };
  const resolve = () => setIssues((items) => items.map((item) => (item.id === selected.id ? { ...item, status: "RESOLVED" } : item)));
  return (
    <Box component="main" sx={{ height: "calc(100vh - 61px)", minHeight: 600, bgcolor: "#f4f7fb", p: 0, display: "flex", flexDirection: "column" }}>
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          borderRadius: 4,
          display: "flex",
          border: "1px solid #e4eaf2",
          boxShadow: "0 12px 30px rgba(28, 47, 77, .06)",
        }}
      >
        <Box sx={{ width: 348, minWidth: 300, borderRight: "1px solid #e6ebf2", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
          <Box sx={{ px: 2, pt: 2.25, pb: 1.75 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.75 }}>
              <Typography sx={{ fontWeight: 800, color: "#25324a" }}>กล่องข้อความ</Typography>
              <Badge badgeContent={issues.filter((item) => item.unread).length} color="error">
                <Chip label="ปัญหาใหม่" size="small" sx={{ bgcolor: "#fff7ed", color: "#c2410c", fontWeight: 700, border: "1px solid #fed7aa" }} />
              </Badge>
            </Box>
            <TextField
              fullWidth
              size="small"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ค้นหาเลขบิล หรือชื่อผู้รับ"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={17} color="#8190a5" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#f8fafc", borderRadius: 2 } }}
            />
          </Box>
          <Divider />
          <List disablePadding sx={{ overflowY: "auto", flex: 1, p: 1 }}>
            {matchedIssues.map((item) => (
              <ListItemButton
                key={item.id}
                selected={item.id === selected.id}
                onClick={() => openIssue(item.id)}
                sx={{
                  borderRadius: 2.5,
                  alignItems: "flex-start",
                  gap: 1.25,
                  px: 1.25,
                  py: 1.25,
                  mb: 0.5,
                  "&.Mui-selected": { bgcolor: "#edf5ff" },
                  "&.Mui-selected:hover": { bgcolor: "#e4f0ff" },
                }}
              >
                <Badge badgeContent={item.unread} color="error" overlap="circular">
                  <Avatar
                    sx={{
                      width: 38,
                      height: 38,
                      bgcolor: item.status === "OPEN" ? "#fff2df" : "#e8f7ef",
                      color: item.status === "OPEN" ? "#d97706" : "#15803d",
                      fontSize: 14,
                      fontWeight: 800,
                    }}
                  >
                    {item.driver.slice(0, 1)}
                  </Avatar>
                </Badge>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                    <Typography noWrap sx={{ fontSize: 13.5, fontWeight: item.unread ? 800 : 700, color: "#28354b" }}>
                      {item.title}
                    </Typography>
                    <Typography sx={{ flexShrink: 0, fontSize: 11, color: "#94a3b8" }}>{item.updatedAt}</Typography>
                  </Box>
                  <Typography noWrap sx={{ mt: 0.25, fontSize: 11.5, color: "#386ac2", fontWeight: 700 }}>
                    {item.receiveCode}
                  </Typography>
                  <Typography noWrap sx={{ mt: 0.4, fontSize: 12, color: "#7c899d" }}>
                    {item.preview}
                  </Typography>
                </Box>
              </ListItemButton>
            ))}
          </List>
        </Box>
        <Box sx={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", bgcolor: "#f9fbfd" }}>
          <Box sx={{ px: { xs: 2, md: 3 }, py: 2, bgcolor: "#fff" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <Avatar sx={{ bgcolor: "#e8f1ff", color: "#2563eb", fontWeight: 800 }}>{selected.driver.slice(0, 1)}</Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                  <Typography noWrap sx={{ fontWeight: 800, color: "#26344b" }}>
                    {selected.title}
                  </Typography>
                  <StatusChip value={selected.status} />
                </Box>
                <Typography noWrap sx={{ mt: 0.25, fontSize: 12, color: "#718096" }}>
                  {selected.receiveCode} · {selected.truckCode} · คนขับ {selected.driver}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1.5, ml: 5.75 }}>
              <Chip label={`ผู้รับ: ${selected.recipient}`} size="small" variant="outlined" sx={{ fontSize: 11.5 }} />
              <Chip
                label={`เลขที่บิล: ${selected.receiveCode}`}
                size="small"
                sx={{ fontSize: 11.5, bgcolor: "#eff6ff", color: "#2563eb", fontWeight: 700 }}
              />
            </Box>
          </Box>
          <Divider />
          <Box sx={{ flex: 1, overflowY: "auto", p: { xs: 2, md: 3 } }}>
            <Typography align="center" sx={{ fontSize: 11, color: "#94a3b8", mb: 3 }}>
              วันนี้
            </Typography>
            {(messages[selected.id] || []).map((message) => {
              const mine = message.by === "admin";
              return (
                <Box key={message.id} sx={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", gap: 1.25, mb: 2.25 }}>
                  {!mine && (
                    <Avatar sx={{ width: 32, height: 32, bgcolor: "#fff2df", color: "#d97706", fontSize: 12, fontWeight: 800 }}>
                      {message.name.slice(0, 1)}
                    </Avatar>
                  )}
                  <Box sx={{ maxWidth: "min(540px, 78%)" }}>
                    <Box sx={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", gap: 1, mb: 0.5 }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#718096" }}>{message.name}</Typography>
                      <Typography sx={{ fontSize: 11, color: "#aab5c4" }}>{message.time}</Typography>
                    </Box>
                    <Box
                      sx={{
                        py: 1.25,
                        px: 1.5,
                        borderRadius: mine ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                        bgcolor: mine ? "#2563eb" : "#fff",
                        color: mine ? "#fff" : "#334155",
                        border: mine ? "none" : "1px solid #e5eaf1",
                        boxShadow: mine ? "none" : "0 2px 5px rgba(30, 41, 59, .04)",
                      }}
                    >
                      <Typography sx={{ fontSize: 14, lineHeight: 1.55 }}>{message.body}</Typography>
                      {message.attachment?.type === "image" && message.attachment.url ? (
                        <Box
                          component="img"
                          src={message.attachment.url}
                          alt={message.attachment.name}
                          sx={{ display: "block", mt: 1, width: "100%", maxWidth: 360, maxHeight: 300, objectFit: "cover", borderRadius: 2 }}
                        />
                      ) : message.attachment ? (
                        <Chip
                          icon={<FileText size={14} />}
                          label={message.attachment.name}
                          size="small"
                          sx={{
                            mt: 1,
                            color: "inherit",
                            bgcolor: mine ? "rgba(255,255,255,.16)" : "#f1f5f9",
                            "& .MuiChip-icon": { color: "inherit" },
                          }}
                        />
                      ) : null}
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
          <Box sx={{ p: 2, bgcolor: "#fff", borderTop: "1px solid #e6ebf2" }}>
            {attachment && (
              <Box sx={{ mb: 1.25 }}>
                {attachment.type === "image" && attachment.url ? (
                  <Box
                    component="img"
                    src={attachment.url}
                    alt={attachment.name}
                    sx={{ display: "block", height: 76, width: 76, objectFit: "cover", borderRadius: 2, border: "1px solid #e2e8f0" }}
                  />
                ) : null}
                <Chip
                  icon={<FileText size={14} />}
                  label={attachment.name}
                  size="small"
                  onDelete={() => setAttachment(undefined)}
                  sx={{ mt: attachment.type === "image" ? 0.75 : 0, bgcolor: "#f1f5f9" }}
                />
              </Box>
            )}
            <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
              <input
                ref={uploadRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                hidden
                onChange={(event) => {
                  const selectedFile = event.target.files?.[0];
                  if (selectedFile)
                    setAttachment({
                      name: selectedFile.name,
                      type: selectedFile.type.startsWith("image/") ? "image" : "file",
                      url: selectedFile.type.startsWith("image/") ? URL.createObjectURL(selectedFile) : undefined,
                    });
                }}
              />
              <IconButton color="primary" onClick={() => uploadRef.current?.click()}>
                <ImagePlus size={21} />
              </IconButton>
              <TextField
                multiline
                maxRows={4}
                fullWidth
                size="small"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    send();
                  }
                }}
                placeholder="พิมพ์ข้อความถึงคนขับ..."
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
              />
              <Button
                variant="contained"
                onClick={send}
                disabled={!draft.trim() && !attachment}
                sx={{ minWidth: 44, width: 44, height: 40, p: 0, borderRadius: 2.5 }}
              >
                <Send size={17} />
              </Button>
            </Box>
            <Box sx={{ mt: 1, ml: 6, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography sx={{ fontSize: 11, color: "#94a3b8" }}>Enter เพื่อส่ง · Shift + Enter ขึ้นบรรทัดใหม่</Typography>
              {selected.status === "OPEN" && (
                <Button size="small" color="success" startIcon={<CheckCircle2 size={15} />} onClick={resolve}>
                  ปิดเรื่อง
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
