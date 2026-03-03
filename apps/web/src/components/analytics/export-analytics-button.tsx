import { Button } from "@/components/ui/button";
import type { AnalyticsData } from "@/fetchers/analytics/get-analytics";
import { exportToExcel } from "@/lib/export-analytics";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { useState } from "react";

interface ExportAnalyticsButtonProps {
  data: AnalyticsData;
  dateRangeLabel: string;
}

export function ExportAnalyticsButton({
  data,
  dateRangeLabel,
}: ExportAnalyticsButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      exportToExcel(data, dateRangeLabel);
    } catch (error) {
      console.error("Error exporting report:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={handleExport}
      disabled={isExporting}
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileSpreadsheet className="w-4 h-4" />
      )}
      Exportar Excel
    </Button>
  );
}
