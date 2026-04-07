function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function downloadImage(billId: number): Promise<void> {
  try {
    const res = await fetch(
      `https://xsendwork.com/api/bills/${billId}/downloadImage`
    );
    if (!res.ok) throw new Error("โหลด URL ไม่สำเร็จ");

    const data = await res.json();
    const fileUrls: string[] = data.files || [];

    if (!fileUrls.length) {
      alert("ไม่มีไฟล์ให้ดาวน์โหลด");
      return;
    }

    for (const url of fileUrls) {
      const resp = await fetch(url);
      if (!resp.ok) continue;

      const blob = await resp.blob();
      const href = URL.createObjectURL(blob);

      const a = document.createElement("a");
      const filename = url.split("/").pop() || "download";
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);

      await sleep(400);
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error("Download error:", err.message);
    } else {
      console.error("Download error:", String(err));
    }
    alert("เกิดข้อผิดพลาดในการดาวน์โหลด");
  }
}
