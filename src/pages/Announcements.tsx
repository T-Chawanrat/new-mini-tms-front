import { useEffect, useState } from "react";
import { CalendarDays, Megaphone, Pin, Search } from "lucide-react";
import AxiosInstance from "../services/apiClient";
import { getUploadUrl } from "../services/uploadUrl";
import type { Announcement } from "../types/announcement";

type OilPrice = { product: string; price: number; priceDate: string | null };

const formatPrice = (price: number) => price.toFixed(2);
const formatPriceDate = (value: string | null) => value?.replace("T", " ") || "-";
const formatOilTableDate = (value: string | null) => {
  if (!value) return "-";
  const [datePart, timePart = ""] = value.split("T");
  const [year, month, day] = datePart.split("-");
  if (!year || !month || !day) return formatPriceDate(value);
  return `${day}-${month}-${Number(year) + 543} ${timePart.slice(0, 5)}`;
};
const fuelLabelImage = `${import.meta.env.BASE_URL}images/fuel/ptt-fuel-labels.png`;

const fuelLabels = [
  { match: "ดีเซล B20", offset: -1, height: 41 },
  { match: "Super Power Diesel", offset: -290, height: 41 },
  { match: "ดีเซล", offset: -43, height: 40 },
  { match: "Super Power X99", offset: -331, height: 41 },
  { match: "Super Power GSH95", offset: -249, height: 41 },
  { match: "แก๊สโซฮอล์ E20", offset: -84, height: 41 },
  { match: "แก๊สโซฮอล์ 91", offset: -125, height: 41 },
  { match: "แก๊สโซฮอล์ 95", offset: -166, height: 41 },
  { match: "เบนซิน", offset: -208, height: 40 },
];

function FuelLabel({ product }: { product: string }) {
  const label = fuelLabels.find(({ match }) => product.includes(match));

  if (!label) return <span className="font-medium text-slate-800">{product}</span>;

  return (
    <span
      className="block w-[121px] overflow-hidden rounded-sm"
      style={{ height: label.height }}
      title={product}
    >
      <img
        src={fuelLabelImage}
        alt={product}
        className="block max-w-none"
        style={{ transform: `translateY(${label.offset}px)` }}
      />
    </span>
  );
}

export default function Announcements() {
  const [oilPrices, setOilPrices] = useState<OilPrice[]>([]);
  const [oilUpdatedAt, setOilUpdatedAt] = useState<string | null>(null);
  const [oilError, setOilError] = useState("");
  const [isOilLoading, setIsOilLoading] = useState(true);
  const [announcementSearch, setAnnouncementSearch] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isAnnouncementsLoading, setIsAnnouncementsLoading] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState("");

  useEffect(() => {
    void AxiosInstance.get("/oil-prices")
      .then(({ data }) => {
        const result = data?.data || data;
        setOilPrices(Array.isArray(result?.items) ? result.items : []);
        setOilUpdatedAt(result?.updatedAt || null);
      })
      .catch(() => setOilError("ไม่สามารถโหลดราคาน้ำมันได้ในขณะนี้"))
      .finally(() => setIsOilLoading(false));
  }, []);

  useEffect(() => {
    let isCurrent = true;
    setIsAnnouncementsLoading(true);
    setAnnouncementsError("");
    void AxiosInstance.get<{ data?: Announcement[] }>("/announcements", {
      params: announcementSearch.trim() ? { search: announcementSearch.trim() } : undefined,
    })
      .then(({ data }) => {
        if (isCurrent) setAnnouncements(Array.isArray(data?.data) ? data.data : []);
      })
      .catch(() => {
        if (isCurrent) setAnnouncementsError("ไม่สามารถโหลดประกาศได้ในขณะนี้");
      })
      .finally(() => {
        if (isCurrent) setIsAnnouncementsLoading(false);
      });
    return () => { isCurrent = false; };
  }, [announcementSearch]);

  return (
    <div className="space-y-6 px-5 sm:px-8 lg:px-10">
      <section className="rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 px-6 py-7 text-white shadow-lg shadow-blue-900/15">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <Megaphone size={25} />
          </span>
          <h1 className="text-2xl font-bold">ประกาศจากบริษัท</h1>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="border-b border-slate-100 pb-4"><h2 className="text-2xl font-bold text-slate-900">ราคาน้ำมันวันนี้</h2></div>
        {isOilLoading ? <div className="space-y-3 py-5">{[1, 2, 3, 4].map((item) => <div key={item} className="h-11 animate-pulse rounded-lg bg-slate-100" />)}</div> : null}
        {oilError ? <p className="py-5 text-sm text-rose-600">{oilError}</p> : null}
        {!isOilLoading && !oilError ? <div className="mt-4 overflow-x-auto"><table className="min-w-[1260px] border-separate border-spacing-0 text-sm"><thead><tr><th className="min-w-44 bg-sky-50 px-4 py-3 text-center font-bold text-blue-950">ปรับราคาเมื่อ</th>{oilPrices.map((oil) => <th key={oil.product} className="bg-white p-0"><FuelLabel product={oil.product} /></th>)}</tr></thead><tbody><tr><td className="px-4 py-4 text-center font-semibold text-slate-900">{formatOilTableDate(oilUpdatedAt)}</td>{oilPrices.map((oil) => <td key={oil.product} className="px-4 py-4 text-center text-base font-bold text-slate-900">{formatPrice(oil.price)}</td>)}</tr></tbody></table>{!oilPrices.length ? <p className="py-5 text-center text-sm text-slate-500">ไม่พบข้อมูลราคาน้ำมัน</p> : null}</div> : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><h2 className="text-2xl font-bold text-slate-900">ประกาศล่าสุด</h2><label className="relative block w-full md:w-[480px]"><Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={announcementSearch} onChange={(event) => setAnnouncementSearch(event.target.value)} placeholder="ค้นหาประกาศ" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label></div>
        <div className="space-y-3">
          {isAnnouncementsLoading ? <div className="space-y-3">{[1, 2].map((item) => <div key={item} className="h-52 animate-pulse rounded-2xl bg-slate-100" />)}</div> : null}
          {announcementsError ? <p className="py-6 text-center text-sm text-rose-600">{announcementsError}</p> : null}
          {!isAnnouncementsLoading && !announcementsError ? announcements.map((announcement) => (
            <article key={announcement.id} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2"><h3 className="text-lg font-bold text-slate-900">{announcement.title}</h3><span className="inline-flex shrink-0 items-center gap-1 text-sm text-slate-500"><CalendarDays size={15} /> {announcement.createdDate}</span></div>
                {announcement.isPinned ? <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-300 px-2.5 py-1 text-xs font-bold text-amber-950"><Pin size={13} fill="currentColor" /> ปักหมุด</span> : null}
              </div>
              {announcement.imageUrls.length ? <div className="mt-5 flex snap-x gap-3 overflow-x-auto pb-2">{announcement.imageUrls.map((url) => { const imageUrl = getUploadUrl(url); return <a key={url} href={imageUrl} target="_blank" rel="noreferrer" className="shrink-0 snap-start"><img src={imageUrl} alt={`รูปประกอบ ${announcement.title}`} className="h-64 w-auto max-w-full rounded-xl bg-slate-50 object-contain transition hover:opacity-90" /></a>; })}</div> : null}
              <p className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-600">{announcement.content}</p>
            </article>
          )) : null}
          {!isAnnouncementsLoading && !announcementsError && !announcements.length ? <p className="py-6 text-center text-sm text-slate-500">ไม่พบประกาศที่ค้นหา</p> : null}
        </div>
      </section>
    </div>
  );
}
