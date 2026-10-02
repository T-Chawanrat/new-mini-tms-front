import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Avatar, Badge, Box, Button, Divider, IconButton, InputAdornment, List, ListItemButton, Paper, TextField, Typography } from "@mui/material";
import { ImagePlus, Search, Send } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AxiosInstance from "../utils/AxiosInstance";
import { getUploadUrl } from "../utils/uploadUrl";

type Thread = { receive_code: string; title: string; updated_at: string; last_message: string; unread_count: number };
type Message = { delivery_status_message_id: number; sender_user_id: number; sender_name: string; message_text?: string; created_date: string; media: { file_name: string; file_path: string }[] };
const time = (value?: string) => value ? new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value)) : "";

export default function DeliveryIssueInbox() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const requestedCode = params.get("bill_no")?.trim() || "";
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedCode, setSelectedCode] = useState(requestedCode);
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipient, setRecipient] = useState("-");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadThreads = async () => {
    const response = await AxiosInstance.get<{ data?: Thread[] }>("/delivery-issues");
    setThreads(response.data.data || []);
  };
  const loadMessages = async (code: string) => {
    if (!code) return;
    try {
      setLoading(true); setError("");
      const response = await AxiosInstance.get<{ data?: { thread: { title: string; recipient_name: string }; messages: Message[] } }>(`/delivery-issues/${encodeURIComponent(code)}/messages`);
      const data = response.data.data;
      setMessages(data?.messages || []); setRecipient(data?.thread.recipient_name || "-");
      setThreads((current) => {
        const existing = current.find((item) => item.receive_code === code);
        const thread = existing || { receive_code: code, title: data?.thread.title || "แชทแจ้งปัญหาการจัดส่ง", updated_at: "", last_message: "ยังไม่มีข้อความ", unread_count: 0 };
        return [{ ...thread, unread_count: 0 }, ...current.filter((item) => item.receive_code !== code)];
      });
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }));
    } catch (requestError) { setError((requestError as any).response?.data?.message || "ไม่สามารถโหลดข้อความได้"); setMessages([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { void loadThreads().catch(() => setError("ไม่สามารถโหลดรายการแชทได้")); }, []);
  useEffect(() => { if (requestedCode) setSelectedCode(requestedCode); }, [requestedCode]);
  useEffect(() => { if (selectedCode) void loadMessages(selectedCode); }, [selectedCode]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const selected = threads.find((item) => item.receive_code === selectedCode);
  const filtered = useMemo(() => { const term = query.trim().toLowerCase(); return term ? threads.filter((item) => [item.receive_code, item.title, item.last_message].some((value) => value.toLowerCase().includes(term))) : threads; }, [threads, query]);
  const chooseFile = (selectedFile?: File) => { if (!selectedFile) return; if (preview) URL.revokeObjectURL(preview); setFile(selectedFile); setPreview(URL.createObjectURL(selectedFile)); };
  const clearFile = () => { if (preview) URL.revokeObjectURL(preview); setFile(null); setPreview(""); };
  const send = async () => {
    if (!selectedCode || (!draft.trim() && !file) || sending) return;
    try {
      setSending(true); setError("");
      const form = new FormData(); if (draft.trim()) form.append("message_text", draft.trim()); if (file) form.append("images", file);
      await AxiosInstance.post(`/delivery-issues/${encodeURIComponent(selectedCode)}/messages`, form);
      setDraft(""); clearFile(); await Promise.all([loadMessages(selectedCode), loadThreads()]);
    } catch (requestError) { setError((requestError as any).response?.data?.message || "ไม่สามารถส่งข้อความได้"); }
    finally { setSending(false); }
  };

  return <Box component="main" className="font-thai" sx={{ height: "calc(100vh - 61px)", minHeight: 600, bgcolor: "#f4f7fb", display: "flex", "& .MuiTypography-root, & .MuiButton-root, & .MuiInputBase-root": { fontFamily: "var(--font-thai)" } }}><Paper elevation={0} sx={{ flex: 1, minHeight: 0, overflow: "hidden", borderRadius: 4, display: "flex", border: "1px solid #e4eaf2" }}>
    <Box sx={{ width: 348, minWidth: 300, borderRight: "1px solid #e6ebf2", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
      <Box sx={{ px: 2, pt: 2.25, pb: 1.75 }}><Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.75 }}><Typography sx={{ fontWeight: 800 }}>แชทแจ้งปัญหา</Typography><Badge badgeContent={threads.filter((item) => item.unread_count).length} color="error" /></Box><TextField fullWidth size="small" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหา Receive Code หรือข้อความ" slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={17} color="#8190a5" /></InputAdornment> } }} /></Box><Divider />
      <List disablePadding sx={{ overflowY: "auto", flex: 1, p: 1 }}>{!filtered.length ? <Typography sx={{ p: 2, fontSize: 13, color: "#94a3b8" }}>ยังไม่มีข้อความ</Typography> : filtered.map((item) => <ListItemButton key={item.receive_code} selected={item.receive_code === selectedCode} onClick={() => setSelectedCode(item.receive_code)} sx={{ borderRadius: 2.5, gap: 1.25, alignItems: "flex-start", mb: .5, "&.Mui-selected": { bgcolor: "#edf5ff" } }}><Badge badgeContent={item.unread_count} color="error"><Avatar sx={{ width: 36, height: 36, bgcolor: "#e8f1ff", color: "#2563eb" }}>{item.receive_code.slice(0, 1)}</Avatar></Badge><Box sx={{ minWidth: 0, flex: 1 }}><Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}><Typography noWrap sx={{ fontSize: 12, fontWeight: 800, color: "#386ac2" }}>{item.receive_code}</Typography><Typography sx={{ fontSize: 11, color: "#94a3b8" }}>{time(item.updated_at)}</Typography></Box><Typography noWrap sx={{ mt: .3, fontSize: 13, fontWeight: item.unread_count ? 800 : 700 }}>{item.title}</Typography><Typography noWrap sx={{ mt: .35, fontSize: 12, color: "#7c899d" }}>{item.last_message || "แนบรูปภาพ"}</Typography></Box></ListItemButton>)}</List>
    </Box>
    <Box sx={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", bgcolor: "#f9fbfd" }}>{selectedCode ? <><Box sx={{ px: 3, py: 2, bgcolor: "#fff" }}><Typography sx={{ fontWeight: 800 }}>{selected?.title || "แชทแจ้งปัญหาการจัดส่ง"}</Typography><Typography sx={{ mt: .4, fontSize: 12, color: "#2563eb", fontWeight: 700 }}>{selectedCode}</Typography><Typography sx={{ mt: .3, fontSize: 12, color: "#718096" }}>ผู้รับ: {recipient}</Typography></Box><Divider />
      <Box ref={scrollRef} sx={{ flex: 1, overflowY: "auto", p: 3 }}>
        {loading ? <Typography align="center" sx={{ color: "#94a3b8" }}>กำลังโหลด...</Typography> : null}
        {!loading && !messages.length ? <Typography align="center" sx={{ color: "#94a3b8" }}>เริ่มต้นการสนทนาของบิลนี้ได้เลย</Typography> : null}
        {messages.map((message) => {
          const mine = message.sender_user_id === Number(user?.id ?? user?.user_id);

          return (
            <Box key={message.delivery_status_message_id} sx={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", mb: 2 }}>
              <Box sx={{ position: "relative", width: "fit-content", maxWidth: "min(540px, 78%)", pt: 2 }}>
                <Typography
                  sx={{
                    position: "absolute",
                    top: 0,
                    ...(mine ? { right: 0, textAlign: "right" } : { left: 0, textAlign: "left" }),
                    whiteSpace: "nowrap",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#718096",
                  }}
                >
                  {message.sender_name} · {time(message.created_date)}
                </Typography>
                <Box sx={{ width: "fit-content", maxWidth: "100%", px: 1.5, py: 1.25, borderRadius: mine ? "16px 4px 16px 16px" : "4px 16px 16px 16px", bgcolor: mine ? "#2563eb" : "#fff", color: mine ? "#fff" : "#334155", border: mine ? "none" : "1px solid #e5eaf1" }}>
                  <Typography sx={{ whiteSpace: "pre-wrap", fontSize: 14 }}>{message.message_text}</Typography>
                  {message.media.map((media) => <Box key={media.file_path} component="img" src={getUploadUrl(media.file_path)} alt={media.file_name} sx={{ mt: 1, display: "block", width: "100%", maxWidth: 360, maxHeight: 300, objectFit: "cover", borderRadius: 2 }} />)}
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
      <Box sx={{ p: 2, bgcolor: "#fff", borderTop: "1px solid #e6ebf2" }}>{file ? <Box sx={{ mb: 1, display: "flex", gap: 1, alignItems: "center" }}><Box component="img" src={preview} alt={file.name} sx={{ width: 58, height: 58, borderRadius: 2, objectFit: "cover" }} /><Button size="small" onClick={clearFile}>เอาออก</Button></Box> : null}{error ? <Typography sx={{ mb: 1, fontSize: 12, color: "#dc2626" }}>{error}</Typography> : null}<Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => chooseFile(event.target.files?.[0])} /><IconButton color="primary" onClick={() => fileRef.current?.click()}><ImagePlus size={21} /></IconButton><TextField multiline maxRows={4} fullWidth size="small" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder="พิมพ์ข้อความ..." /><Button variant="contained" disabled={sending || (!draft.trim() && !file)} onClick={() => void send()} sx={{ minWidth: 44, width: 44, height: 40, p: 0 }}><Send size={17} /></Button></Box></Box>
    </> : <Box sx={{ flex: 1, display: "grid", placeItems: "center", color: "#94a3b8" }}>เลือกบิลจากรายการแชท</Box>}</Box>
  </Paper></Box>;
}
