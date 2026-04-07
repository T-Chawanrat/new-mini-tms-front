import React, { createContext, useState, useEffect, useContext, useCallback } from "react";

interface ColumnWidthsType {
  columnWidths: number[];
  setColumnWidths: React.Dispatch<React.SetStateAction<number[]>>;
  setPageKey: (pageKey: string) => void;
}

const ColumnWidths = createContext<ColumnWidthsType | undefined>(undefined);

export const ColumnWidthsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [columnWidths, setColumnWidths] = useState<number[]>(new Array(35).fill(150));
  const [currentPageKey, setCurrentPageKey] = useState<string>("default");

  const setPageKey = useCallback(
    (pageKey: string) => {
      setColumnWidths((prevWidths) => {
        if (pageKey === currentPageKey) return prevWidths;

        localStorage.setItem(`columnWidths_${currentPageKey}`, JSON.stringify(prevWidths));

        const savedWidths = localStorage.getItem(`columnWidths_${pageKey}`);
        if (savedWidths) {
          try {
            return JSON.parse(savedWidths);
          } catch (error) {
            console.error("Error parsing saved column widths:", error);
            return new Array(35).fill(150);
          }
        }
        return new Array(35).fill(150);
      });

      setCurrentPageKey(pageKey);
    },
    [currentPageKey]
  );

  useEffect(() => {
    if (currentPageKey !== "default") {
      localStorage.setItem(`columnWidths_${currentPageKey}`, JSON.stringify(columnWidths));
    }
  }, [columnWidths, currentPageKey]);

  return (
    <ColumnWidths.Provider value={{ columnWidths, setColumnWidths, setPageKey }}>{children}</ColumnWidths.Provider>
  );
};

export const useColumnWidths = () => {
  const context = useContext(ColumnWidths);
  if (context === undefined) {
    throw new Error("useColumnWidths must be used within a ColumnWidthsProvider");
  }
  return context;
};
