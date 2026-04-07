import React, { useEffect, useRef } from "react";
import { useColumnWidths } from "../context/ColumnWidths";

interface ResizableColumnsProps {
  headers: any[];
  pageKey: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (headerKey: string) => void;
  minWidths?: Record<number, number>;
}

const headerKeyMapping: { [header: string]: string } = {
  วันที่หมายเหตุล่าสุด: "create_date",
};

const ResizableColumns: React.FC<ResizableColumnsProps> = ({
  headers,
  pageKey,
  sortBy,
  sortOrder,
  onSort,
  minWidths = {},
}) => {
  const { columnWidths, setColumnWidths, setPageKey } = useColumnWidths();
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized.current) {
      setPageKey(pageKey);
      isInitialized.current = true;
    } else if (pageKey) {
      setPageKey(pageKey);
    }
  }, [pageKey, setPageKey]);

  const handleMouseDown = (index: number, event: React.MouseEvent) => {
    event.preventDefault();

    const startX = event.clientX;
    const startWidth = columnWidths[index] ?? 120; // ⭐ กัน undefined ให้มีค่าเริ่มต้น
    const min = minWidths[index] ?? 50;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(startWidth + deltaX, min);
      setColumnWidths((prevWidths) =>
        prevWidths.map((width, i) => (i === index ? newWidth : width))
      );
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStart = (index: number, event: React.TouchEvent) => {
    const startX = event.touches[0].clientX;
    const startWidth = columnWidths[index] ?? 150;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      const deltaX = moveEvent.touches[0].clientX - startX;
      const newWidth = Math.max(startWidth + deltaX, 50);
      setColumnWidths((prevWidths) =>
        prevWidths.map((width, i) => (i === index ? newWidth : width))
      );
    };

    const handleTouchEnd = () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };

    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);
  };

  const handleAutoFit = (
    index: number,
    event: React.MouseEvent<HTMLSpanElement>
  ) => {
    const handleElement = event.currentTarget as HTMLElement;
    const table = handleElement.closest("table");
    if (!table) return;

    const rows = Array.from(table.querySelectorAll("tr"));
    let maxWidth = minWidths[index] ?? 60;

    rows.forEach((row) => {
      const cell = row.children[index] as HTMLElement | undefined;
      if (!cell) return;

      const inner =
        (cell.querySelector("span, div, p") as HTMLElement | null) || cell;

      const width = inner.scrollWidth + 16;
      if (width > maxWidth) maxWidth = width;
    });

    setColumnWidths((prevWidths) =>
      prevWidths.map((width, i) => (i === index ? maxWidth : width))
    );
  };

  return (
    <thead className="bg-gray-100">
      <tr>
        {headers.map((header, index) => {
          const headerText = typeof header === "string" ? header : "";
          const headerKey = headerText
            ? headerKeyMapping[headerText]
            : undefined;

          const sortable = !!(headerKey && onSort);
          const isActiveSort = sortable && sortBy === headerKey;

          const isCheckboxColumn = typeof header !== "string";

          // ⭐⭐ ตรงนี้คือหัวใจ: แยก logic checkbox / ปกติ
          let widthPx: number;

          if (isCheckboxColumn) {
            // คอลัมน์แบบ JSX (เช่น checkbox) → ให้แคบได้ตาม minWidths หรือ default เล็ก ๆ
            widthPx = minWidths[index] ?? 28; // ← อยาก 20/24 ก็เปลี่ยนตรงนี้
          } else {
            const min = minWidths[index] ?? 60;
            const baseWidth =
              columnWidths[index] !== undefined ? columnWidths[index] : 120; // default เดิม
            widthPx = Math.max(min, baseWidth);
          }

          return (
            <th
              key={index}
              style={{ width: `${widthPx}px` }}
              className="relative px-4 py-2 border-b text-left border-gray-200 select-none bg-gray-100 sticky top-0 z-20"
            >
              <div className="flex items-center justify-between">
                <span
                  className={
                    sortable ? "cursor-pointer flex items-center gap-1" : ""
                  }
                  onClick={
                    sortable && headerKey
                      ? () => onSort && onSort(headerKey)
                      : undefined
                  }
                  style={{
                    fontWeight: isActiveSort ? "bold" : undefined,
                  }}
                  tabIndex={sortable ? 0 : undefined}
                  role={sortable ? "button" : undefined}
                >
                  {header}
                  {sortable && (
                    <span>
                      {isActiveSort ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  )}
                </span>

                {/* คอลัมน์ checkbox ยังไม่มี handle resize เหมือนเดิม */}
                <span
                  className={`absolute right-0 top-0 h-full w-1 border-r border-gray-300 ${
                    isCheckboxColumn ? "" : "cursor-col-resize"
                  }`}
                  onMouseDown={
                    isCheckboxColumn
                      ? undefined
                      : (e) => handleMouseDown(index, e)
                  }
                  onDoubleClick={
                    isCheckboxColumn
                      ? undefined
                      : (e) => handleAutoFit(index, e)
                  }
                  onTouchStart={
                    isCheckboxColumn
                      ? undefined
                      : (e) => handleTouchStart(index, e)
                  }
                />
              </div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
};

export default ResizableColumns;
