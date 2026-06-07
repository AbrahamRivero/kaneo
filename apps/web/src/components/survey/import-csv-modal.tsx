import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useImportCSV } from "@/hooks/mutations/survey";
import { useState } from "react";

interface ImportCSVModalProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
}

export default function ImportCSVModal({
  open,
  onClose,
  workspaceId,
}: ImportCSVModalProps) {
  const [csvContent, setCsvContent] = useState("");
  const importCSV = useImportCSV();

  const handleImport = async () => {
    if (!csvContent.trim()) return;
    await importCSV.mutateAsync({ workspaceId, csvContent });
    setCsvContent("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Import Survey from CSV</DialogTitle>
          <DialogDescription>
            Paste the CSV content from your Excel survey file. The system will
            parse the date and data automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            rows={10}
            value={csvContent}
            onChange={(e) => setCsvContent(e.target.value)}
            placeholder="Paste CSV content here..."
            className="font-mono text-xs"
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!csvContent.trim() || importCSV.isPending}
            >
              <Upload className="w-4 h-4 mr-2" />
              {importCSV.isPending ? "Importing..." : "Import"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
