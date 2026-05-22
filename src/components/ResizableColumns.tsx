// import React, { useEffect, useRef } from "react";
// import { useColumnWidths } from "../context/ColumnWidths";

// interface ResizableColumnsProps {
//   headers: any[];
//   pageKey: string;
//   sortBy?: string;
//   sortOrder?: "asc" | "desc";
//   onSort?: (headerKey: string) => void;
//   minWidths?: Record<number, number>;
// }

// const headerKeyMapping: { [header: string]: string } = {
//   วันที่หมายเหตุล่าสุด: "create_date",
// };

// const ResizableColumns: React.FC<ResizableColumnsProps> = ({
//   headers,
//   pageKey,
//   sortBy,
//   sortOrder,
//   onSort,
//   minWidths = {},
// }) => {
//   const { columnWidths, setColumnWidths, setPageKey } = useColumnWidths();
//   const isInitialized = useRef(false);

//   useEffect(() => {
//     if (!isInitialized.current) {
//       setPageKey(pageKey);
//       isInitialized.current = true;
//     } else if (pageKey) {
//       setPageKey(pageKey);
//     }
//   }, [pageKey, setPageKey]);

//   const handleMouseDown = (index: number, event: React.MouseEvent) => {
//   event.preventDefault();

//   const startX = event.clientX;
//   const startWidth = columnWidths[index] ?? 120;
//   const min = minWidths[index] ?? 50;

//   let currentWidth = startWidth;

//   const thList = document.querySelectorAll("th");
//   const targetTh = thList[index] as HTMLElement;

//   let frame: number | null = null;

//   const handleMouseMove = (moveEvent: MouseEvent) => {
//     if (frame) return;

//     frame = requestAnimationFrame(() => {
//       const deltaX = moveEvent.clientX - startX;
//       const newWidth = Math.max(startWidth + deltaX, min);

//       currentWidth = newWidth;

//       if (targetTh) {
//         targetTh.style.width = `${newWidth}px`;
//       }

//       frame = null;
//     });
//   };

//   const handleMouseUp = () => {
//     setColumnWidths((prevWidths) =>
//       prevWidths.map((width, i) =>
//         i === index ? currentWidth : width
//       )
//     );

//     document.removeEventListener("mousemove", handleMouseMove);
//     document.removeEventListener("mouseup", handleMouseUp);
//   };

//   document.addEventListener("mousemove", handleMouseMove);
//   document.addEventListener("mouseup", handleMouseUp);
// };

//   const handleTouchStart = (index: number, event: React.TouchEvent) => {
//     const startX = event.touches[0].clientX;
//     const startWidth = columnWidths[index] ?? 150;

//     const handleTouchMove = (moveEvent: TouchEvent) => {
//       const deltaX = moveEvent.touches[0].clientX - startX;
//       const newWidth = Math.max(startWidth + deltaX, 50);
//       setColumnWidths((prevWidths) =>
//         prevWidths.map((width, i) => (i === index ? newWidth : width))
//       );
//     };

//     const handleTouchEnd = () => {
//       document.removeEventListener("touchmove", handleTouchMove);
//       document.removeEventListener("touchend", handleTouchEnd);
//     };

//     document.addEventListener("touchmove", handleTouchMove);
//     document.addEventListener("touchend", handleTouchEnd);
//   };

//   const handleAutoFit = (
//     index: number,
//     event: React.MouseEvent<HTMLSpanElement>
//   ) => {
//     const handleElement = event.currentTarget as HTMLElement;
//     const table = handleElement.closest("table");
//     if (!table) return;

//     const rows = Array.from(table.querySelectorAll("tr"));
//     let maxWidth = minWidths[index] ?? 60;

//     rows.forEach((row) => {
//       const cell = row.children[index] as HTMLElement | undefined;
//       if (!cell) return;

//       const inner =
//         (cell.querySelector("span, div, p") as HTMLElement | null) || cell;

//       const width = inner.scrollWidth + 16;
//       if (width > maxWidth) maxWidth = width;
//     });

//     setColumnWidths((prevWidths) =>
//       prevWidths.map((width, i) => (i === index ? maxWidth : width))
//     );
//   };

//   return (
//     <thead className="bg-gray-100">
//       <tr>
//         {headers.map((header, index) => {
//           const headerText = typeof header === "string" ? header : "";
//           const headerKey = headerText
//             ? headerKeyMapping[headerText]
//             : undefined;

//           const sortable = !!(headerKey && onSort);
//           const isActiveSort = sortable && sortBy === headerKey;

//           const isCheckboxColumn = typeof header !== "string";

//           // ⭐⭐ ตรงนี้คือหัวใจ: แยก logic checkbox / ปกติ
//           let widthPx: number;

//           if (isCheckboxColumn) {
//             // คอลัมน์แบบ JSX (เช่น checkbox) → ให้แคบได้ตาม minWidths หรือ default เล็ก ๆ
//             widthPx = minWidths[index] ?? 28; // ← อยาก 20/24 ก็เปลี่ยนตรงนี้
//           } else {
//             const min = minWidths[index] ?? 60;
//             const baseWidth =
//               columnWidths[index] !== undefined ? columnWidths[index] : 120; // default เดิม
//             widthPx = Math.max(min, baseWidth);
//           }

//           return (
//             <th
//               key={index}
//               style={{ width: `${widthPx}px` }}
//               className="relative px-4 py-2 border-b text-left border-gray-200 select-none bg-gray-100 sticky top-0 z-20"
//             >
//               <div className="flex items-center justify-between">
//                 <span
//                   className={
//                     sortable ? "cursor-pointer flex items-center gap-1" : ""
//                   }
//                   onClick={
//                     sortable && headerKey
//                       ? () => onSort && onSort(headerKey)
//                       : undefined
//                   }
//                   style={{
//                     fontWeight: isActiveSort ? "bold" : undefined,
//                   }}
//                   tabIndex={sortable ? 0 : undefined}
//                   role={sortable ? "button" : undefined}
//                 >
//                   {header}
//                   {sortable && (
//                     <span>
//                       {isActiveSort ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}
//                     </span>
//                   )}
//                 </span>

//                 {/* คอลัมน์ checkbox ยังไม่มี handle resize เหมือนเดิม */}
//                 <span
//                   className={`absolute right-0 top-0 h-full w-1 border-r border-gray-300 ${
//                     isCheckboxColumn ? "" : "cursor-col-resize"
//                   }`}
//                   onMouseDown={
//                     isCheckboxColumn
//                       ? undefined
//                       : (e) => handleMouseDown(index, e)
//                   }
//                   onDoubleClick={
//                     isCheckboxColumn
//                       ? undefined
//                       : (e) => handleAutoFit(index, e)
//                   }
//                   onTouchStart={
//                     isCheckboxColumn
//                       ? undefined
//                       : (e) => handleTouchStart(index, e)
//                   }
//                 />
//               </div>
//             </th>
//           );
//         })}
//       </tr>
//     </thead>
//   );
// };

// export default ResizableColumns;


import React, { useEffect, useMemo, useRef } from "react";
import { useColumnWidths } from "../context/ColumnWidths";

interface ResizableColumnsProps {
  headers: any[];
  pageKey: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (headerKey: string) => void;
  minWidths?: Record<number, number>;
  maxWidths?: Record<number, number>;
  defaultWidths?: Record<number, number>;
}

const headerKeyMapping: { [header: string]: string } = {
  วันที่หมายเหตุล่าสุด: "create_date",

  "Shipper Code": "shipper_code",
  "Shipper Name": "shipper_name",
  Tel: "tel",
  Address: "address",
  Subdistrict: "subdistrict_name",
  District: "district_name",
  Province: "province_name",
  Zipcode: "zip_code",
  Status: "is_deleted",
};

const DEFAULT_WIDTH = 140;
const DEFAULT_MIN_WIDTH = 70;
const DEFAULT_MAX_WIDTH = 9999;

const clampWidth = (width: number, min: number, max: number) => {
  return Math.min(Math.max(width, min), max);
};

const getCellText = (cell: HTMLElement) => {
  const cloned = cell.cloneNode(true) as HTMLElement;

  cloned.querySelectorAll("button, svg").forEach((el) => el.remove());

  return cloned.textContent?.replace(/\s+/g, " ").trim() || "";
};

const getTextWidthByCanvas = (() => {
  let canvas: HTMLCanvasElement | null = null;

  return (text: string, font: string) => {
    if (!canvas) {
      canvas = document.createElement("canvas");
    }

    const context = canvas.getContext("2d");
    if (!context) return 0;

    context.font = font;

    return Math.ceil(context.measureText(text || "-").width);
  };
})();

const ResizableColumns: React.FC<ResizableColumnsProps> = ({
  headers,
  pageKey,
  sortBy,
  sortOrder,
  onSort,
  minWidths = {},
  maxWidths = {},
  defaultWidths = {},
}) => {
  const { columnWidths, setColumnWidths, setPageKey } = useColumnWidths();

  const isInitialized = useRef(false);
  const frameRef = useRef<number | null>(null);
  const latestWidthsRef = useRef<number[]>([]);

  const getMin = (index: number) => minWidths[index] ?? DEFAULT_MIN_WIDTH;
  const getMax = (index: number) => maxWidths[index] ?? DEFAULT_MAX_WIDTH;

  const getBaseWidth = (index: number) => {
    return (
      columnWidths[index] ??
      defaultWidths[index] ??
      minWidths[index] ??
      DEFAULT_WIDTH
    );
  };

  const resolvedWidths = useMemo(() => {
    return headers.map((header, index) => {
      const isCustomColumn = typeof header !== "string";

      if (isCustomColumn) {
        return minWidths[index] ?? 48;
      }

      return clampWidth(getBaseWidth(index), getMin(index), getMax(index));
    });
  }, [headers, columnWidths, minWidths, maxWidths, defaultWidths]);

  useEffect(() => {
    latestWidthsRef.current = resolvedWidths;
  }, [resolvedWidths]);

  useEffect(() => {
    if (!isInitialized.current) {
      setPageKey(pageKey);
      isInitialized.current = true;
    } else if (pageKey) {
      setPageKey(pageKey);
    }
  }, [pageKey, setPageKey]);

  useEffect(() => {
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const setTableColumnWidth = (
    table: HTMLTableElement,
    index: number,
    width: number,
  ) => {
    table.style.setProperty(`--col-${index}`, `${width}px`);
  };

  const commitColumnWidth = (index: number, width: number) => {
    setColumnWidths((prevWidths) => {
      const nextWidths = [...prevWidths];
      nextWidths[index] = width;
      return nextWidths;
    });
  };

  const handlePointerDown = (
    index: number,
    event: React.PointerEvent<HTMLSpanElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const handleElement = event.currentTarget as HTMLElement;
    const table = handleElement.closest("table") as HTMLTableElement | null;

    if (!table) return;

    const startX = event.clientX;
    const min = getMin(index);
    const max = getMax(index);
    const startWidth = latestWidthsRef.current[index] ?? getBaseWidth(index);

    let currentWidth = startWidth;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (frameRef.current) return;

      frameRef.current = requestAnimationFrame(() => {
        const deltaX = moveEvent.clientX - startX;
        const nextWidth = clampWidth(startWidth + deltaX, min, max);

        currentWidth = nextWidth;
        latestWidthsRef.current[index] = nextWidth;

        setTableColumnWidth(table, index, nextWidth);

        frameRef.current = null;
      });
    };

    const handlePointerUp = () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      commitColumnWidth(index, currentWidth);

      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);

      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    document.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });

    document.addEventListener("pointerup", handlePointerUp);
  };

  const handleAutoFit = (
    index: number,
    event: React.MouseEvent<HTMLSpanElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const handleElement = event.currentTarget as HTMLElement;
    const table = handleElement.closest("table") as HTMLTableElement | null;

    if (!table) return;

    const min = getMin(index);
    const max = getMax(index);

    const rows = Array.from(table.querySelectorAll("tr"));
    let bestWidth = min;

    rows.forEach((row) => {
      const cell = row.children[index] as HTMLElement | undefined;
      if (!cell) return;

      const text = getCellText(cell);
      if (!text) return;

      const computedStyle = window.getComputedStyle(cell);
      const font = computedStyle.font;

      const paddingLeft = parseFloat(computedStyle.paddingLeft || "0");
      const paddingRight = parseFloat(computedStyle.paddingRight || "0");

      const textWidth = getTextWidthByCanvas(text, font);

      const safeExtra = 36;
      const width = textWidth + paddingLeft + paddingRight + safeExtra;

      if (width > bestWidth) {
        bestWidth = width;
      }
    });

    const nextWidth = clampWidth(bestWidth, min, max);

    latestWidthsRef.current[index] = nextWidth;
    setTableColumnWidth(table, index, nextWidth);
    commitColumnWidth(index, nextWidth);
  };

  return (
    <>
      <colgroup>
        {headers.map((_, index) => {
          const width = resolvedWidths[index];

          return (
            <col
              key={index}
              style={{
                width: `var(--col-${index}, ${width}px)`,
                minWidth: `var(--col-${index}, ${width}px)`,
              }}
            />
          );
        })}
      </colgroup>

      <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
        <tr>
          {headers.map((header, index) => {
            const headerText = typeof header === "string" ? header : "";
            const headerKey = headerText
              ? headerKeyMapping[headerText]
              : undefined;

            const sortable = !!(headerKey && onSort);
            const isActiveSort = sortable && sortBy === headerKey;
            const isCustomColumn = typeof header !== "string";

            const isCenterColumn =
              headerText === "#" ||
              headerText === "Status" ||
              headerText === "จัดการ";

            return (
              <th
                key={index}
                className={`relative py-4 px-3 border-b border-slate-100 select-none bg-slate-50 sticky top-0 z-20 ${
                  isCenterColumn ? "text-center" : "text-left"
                }`}
              >
                <div
                  className={`flex items-center gap-2 ${
                    isCenterColumn ? "justify-center" : "justify-between"
                  }`}
                >
                  <span
                    className={`block truncate ${
                      sortable ? "cursor-pointer flex items-center gap-1" : ""
                    }`}
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
                    title={headerText}
                  >
                    {header}
                    {sortable && (
                      <span className="text-[10px]">
                        {isActiveSort
                          ? sortOrder === "asc"
                            ? "▲"
                            : "▼"
                          : "↕"}
                      </span>
                    )}
                  </span>

                  {!isCustomColumn && (
                    <span
                      className="absolute right-0 top-0 h-full w-2 cursor-col-resize border-r border-slate-200 hover:border-blue-400 active:border-blue-500"
                      onPointerDown={(e) => handlePointerDown(index, e)}
                      onDoubleClick={(e) => handleAutoFit(index, e)}
                      title="ลากเพื่อปรับขนาด / ดับเบิลคลิกเพื่อ auto fit"
                    />
                  )}
                </div>
              </th>
            );
          })}
        </tr>
      </thead>
    </>
  );
};

export default ResizableColumns;