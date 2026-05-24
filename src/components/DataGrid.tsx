import {
  DataGrid as MuiDataGrid,
  type GridColDef,
  type GridRowsProp,
} from "@mui/x-data-grid";

type AppDataGridProps = {
  rows?: GridRowsProp;
  columns?: GridColDef[];
  loading?: boolean;
  getRowId?: (row: any) => string | number;
  height?: number | string;
  pageSize?: number;
};

export default function AppDataGrid({
  rows = [],
  columns = [],
  loading = false,
  getRowId,
  height = 560,
  pageSize = 100,
}: AppDataGridProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full min-h-0">
      <div style={{ height, width: "100%", minHeight: 0 }}>
        <MuiDataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          getRowId={getRowId}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize,
                page: 0,
              },
            },
          }}
          sx={{
            border: "none",
            fontFamily: "inherit",
            height: "100%",

            "& .MuiDataGrid-main": {
              minHeight: 0,
            },

            "& .MuiDataGrid-virtualScroller": {
              minHeight: 0,
              overflowX: "auto",
              overflowY: "auto",
            },

            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#f8fafc",
              color: "#64748b",
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              borderBottom: "1px solid #e2e8f0",
              minHeight: "48px !important",
              maxHeight: "48px !important",
              lineHeight: "48px !important",
            },

            "& .MuiDataGrid-columnHeader": {
              backgroundColor: "#f8fafc",
              outline: "none !important",
            },

            "& .MuiDataGrid-columnHeader:focus": {
              outline: "none !important",
            },

            "& .MuiDataGrid-columnHeader:focus-within": {
              outline: "none !important",
            },

            "& .MuiDataGrid-columnHeaderTitle": {
              fontWeight: 600,
            },

            "& .MuiDataGrid-cell": {
              color: "#334155",
              fontSize: "14px",
              borderBottom: "1px solid #f1f5f9",
              outline: "none !important",
            },

            "& .MuiDataGrid-cell:focus": {
              outline: "none !important",
            },

            "& .MuiDataGrid-cell:focus-within": {
              outline: "none !important",
            },

            "& .MuiDataGrid-row:hover": {
              backgroundColor: "#f8fafc",
            },

            "& .MuiDataGrid-footerContainer": {
              borderTop: "1px solid #e2e8f0",
              backgroundColor: "#ffffff",
              minHeight: "52px",
              maxHeight: "52px",
              flexShrink: 0,
            },

            "& .MuiTablePagination-root": {
              color: "#475569",
              overflow: "hidden",
            },

            "& .MuiTablePagination-toolbar": {
              minHeight: "52px",
              paddingLeft: "16px",
              paddingRight: "16px",
            },

            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
              {
                margin: 0,
                fontSize: "13px",
                color: "#475569",
              },

            "& .MuiDataGrid-columnSeparator": {
              color: "#cbd5e1",
            },

            "& .MuiDataGrid-columnSeparator:hover": {
              color: "#2563eb",
            },

            "& .MuiDataGrid-overlayWrapper": {
              minHeight: "160px",
            },
          }}
        />
      </div>
    </div>
  );
}