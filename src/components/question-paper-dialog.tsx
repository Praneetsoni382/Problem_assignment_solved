import { useState, useEffect } from "react";
import { FileText, ExternalLink, Download, Loader2, Maximize2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ZoomableImage } from "@/components/zoomable-image";
import { getStoragePathFromQuestionPaperUrl } from "@/lib/assignment-utils";

/**
 * Converts a base64 Data URL to a native browser Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(",");
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "application/pdf";
  const binaryStr = atob(parts[1] || "");
  const len = binaryStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/**
 * Safely opens a document (PDF / Image / Base64 Data URL / Cloud Storage)
 * in a new tab without triggering browser top-level data URL security blocks.
 */
export function openDocumentSafely(rawUrl: string, filename = "question-paper") {
  if (!rawUrl) return;
  const cleanUrl = getStoragePathFromQuestionPaperUrl(rawUrl) || rawUrl;

  if (cleanUrl.startsWith("data:")) {
    try {
      const blob = dataUrlToBlob(cleanUrl);
      const isPdf = cleanUrl.includes("application/pdf");
      const ext = isPdf ? "pdf" : "jpg";
      const blobUrl = URL.createObjectURL(blob);

      const win = window.open(blobUrl, "_blank");
      if (!win) {
        // Fallback: Trigger direct download if popups are blocked
        downloadBlob(blob, `${filename}.${ext}`);
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 180000);
      return;
    } catch (err) {
      console.warn("Could not open blob data URL:", err);
    }
  }

  window.open(cleanUrl, "_blank", "noopener,noreferrer");
}

/**
 * Downloads a blob as a file
 */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/**
 * Downloads from any URL (data URL or http)
 */
export function downloadDocument(rawUrl: string, filename = "question-paper") {
  const cleanUrl = getStoragePathFromQuestionPaperUrl(rawUrl) || rawUrl;
  if (cleanUrl.startsWith("data:")) {
    const blob = dataUrlToBlob(cleanUrl);
    const isPdf = cleanUrl.includes("application/pdf");
    downloadBlob(blob, `${filename}.${isPdf ? "pdf" : "jpg"}`);
    return;
  }
  const a = document.createElement("a");
  a.href = cleanUrl;
  a.download = `${filename}.pdf`;
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

interface QuestionPaperDialogProps {
  url?: string | null;
  title?: string;
  className?: string;
  buttonVariant?: "default" | "outline" | "secondary" | "ghost";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  buttonText?: string;
}

export function QuestionPaperDialog({
  url,
  title = "Question Paper",
  className,
  buttonVariant = "outline",
  buttonSize = "sm",
  buttonText = "Question Paper",
}: QuestionPaperDialogProps) {
  const [open, setOpen] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const cleanUrl = url ? getStoragePathFromQuestionPaperUrl(url) || url : null;
  const isPdf =
    cleanUrl?.startsWith("data:application/pdf") ||
    cleanUrl?.toLowerCase().includes(".pdf") ||
    cleanUrl?.toLowerCase().includes("application/pdf") ||
    cleanUrl?.includes("question-papers");
  const isDataUrl = cleanUrl?.startsWith("data:");

  useEffect(() => {
    if (!open || !cleanUrl) {
      setBlobUrl(null);
      return;
    }

    let createdUrl: string | null = null;
    if (isDataUrl) {
      setLoading(true);
      try {
        const blob = dataUrlToBlob(cleanUrl);
        createdUrl = URL.createObjectURL(blob);
        setBlobUrl(createdUrl);
      } catch (e) {
        console.error("Error creating blob object URL for preview:", e);
      } finally {
        setLoading(false);
      }
    } else {
      setBlobUrl(cleanUrl);
    }

    return () => {
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [open, cleanUrl, isDataUrl]);

  if (!cleanUrl) return null;

  const displayUrl = blobUrl || cleanUrl;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={buttonVariant}
          size={buttonSize}
          className={`inline-flex items-center gap-1.5 font-semibold shadow-xs ${className || ""}`}
        >
          <FileText className="size-4 text-[#0d5c52] dark:text-emerald-400" />
          <span>{buttonText}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl w-[95vw] sm:w-[90vw] p-4 sm:p-6 overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl">
        <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/70 pr-8">
          <div>
            <DialogTitle className="font-display text-lg font-bold text-foreground">
              {title}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Review questions, instructions, and marks distribution
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openDocumentSafely(cleanUrl, title)}
              className="inline-flex items-center gap-1.5 rounded-xl text-xs font-semibold"
            >
              <ExternalLink className="size-3.5" />
              <span className="hidden sm:inline">Open in New Tab</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => downloadDocument(cleanUrl, title)}
              className="inline-flex items-center gap-1.5 rounded-xl text-xs font-semibold"
            >
              <Download className="size-3.5" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="relative mt-3 min-h-[50vh] max-h-[75vh] overflow-auto rounded-2xl bg-neutral-100/70 p-2 dark:bg-neutral-900/60">
          {loading ? (
            <div className="flex h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-5 animate-spin text-[#0d5c52]" />
              <span>Preparing document preview...</span>
            </div>
          ) : isPdf ? (
            <div className="h-[68vh] w-full overflow-hidden rounded-xl bg-white shadow-inner dark:bg-neutral-950">
              <iframe
                src={`${displayUrl}#toolbar=1&navpanes=0`}
                title={title}
                className="h-full w-full border-0 rounded-xl"
              />
            </div>
          ) : (
            <div className="flex justify-center p-2">
              <ZoomableImage src={displayUrl} alt={title} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
