import axios from "axios";

type ExportExcelOptions = {
  url: string;
  filename: string;
  params?: Record<string, string | number | boolean>;
};

export async function ExportExcel({
  url,
  filename,
  params = {},
}: ExportExcelOptions): Promise<void> {
  try {
    const response = await axios.get(url, {
      params,
      responseType: "blob",
    });

    const urlBlob = window.URL.createObjectURL(
      new Blob([response.data])
    );

    const a = document.createElement("a");
    a.href = urlBlob;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(urlBlob);
  } catch (error) {
    console.error("Export excel error:", error);
    throw new Error("Download failed");
  }
}
