"use client";

import * as React from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface ExportButtonProps {
  onExportCsv?: () => Promise<Blob>;
  onExportPdf?: () => Promise<Blob>;
  onExportExcel?: () => Promise<Blob>;
  filename?: string;
  disabled?: boolean;
}

export function ExportButton({
  onExportCsv,
  onExportPdf,
  onExportExcel,
  filename = "export",
  disabled = false,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async (
    exportFn: () => Promise<Blob>,
    extension: string,
    mimeType: string
  ) => {
    setIsExporting(true);
    try {
      const blob = await exportFn();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}-${new Date().toISOString().split("T")[0]}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Export successful!`);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const hasMultipleOptions =
    [onExportCsv, onExportPdf, onExportExcel].filter(Boolean).length > 1;

  if (!hasMultipleOptions) {
    // Single export option - show simple button
    const singleExport = onExportCsv || onExportPdf || onExportExcel;
    const extension = onExportCsv ? "csv" : onExportPdf ? "pdf" : "xlsx";
    const mimeType = onExportCsv
      ? "text/csv"
      : onExportPdf
      ? "application/pdf"
      : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => singleExport && handleExport(singleExport, extension, mimeType)}
        disabled={disabled || isExporting || !singleExport}
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Download className="h-4 w-4 mr-2" />
        )}
        Export
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onExportCsv && (
          <DropdownMenuItem
            onClick={() => handleExport(onExportCsv, "csv", "text/csv")}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export as CSV
          </DropdownMenuItem>
        )}
        {onExportExcel && (
          <DropdownMenuItem
            onClick={() =>
              handleExport(
                onExportExcel,
                "xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              )
            }
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export as Excel
          </DropdownMenuItem>
        )}
        {onExportPdf && (
          <DropdownMenuItem
            onClick={() => handleExport(onExportPdf, "pdf", "application/pdf")}
          >
            <FileText className="h-4 w-4 mr-2" />
            Export as PDF
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
