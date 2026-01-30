import { useState, useCallback } from "react";
import { Upload, X, FileText, Image, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  usePropertyDocuments,
  useUploadPropertyDocument,
  useDeletePropertyDocument,
  PropertyDocument,
} from "@/hooks/usePropertyDocuments";
import { useToast } from "@/hooks/use-toast";

interface PropertyDocumentsProps {
  propertyId: string;
}

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith("image/")) return Image;
  return FileText;
};

export function PropertyDocuments({ propertyId }: PropertyDocumentsProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const { data: documents = [], isLoading } = usePropertyDocuments(propertyId);
  const uploadDocument = useUploadPropertyDocument();
  const deleteDocument = useDeletePropertyDocument();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      await uploadFiles(files);
    },
    [propertyId]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      await uploadFiles(files);
      e.target.value = "";
    },
    [propertyId]
  );

  const uploadFiles = async (files: File[]) => {
    for (const file of files) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 10MB limit`,
          variant: "destructive",
        });
        continue;
      }

      try {
        await uploadDocument.mutateAsync({ propertyId, file });
        toast({
          title: "File uploaded",
          description: `${file.name} uploaded successfully`,
        });
      } catch (error) {
        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}`,
          variant: "destructive",
        });
      }
    }
  };

  const handleDelete = async (doc: PropertyDocument) => {
    try {
      await deleteDocument.mutateAsync({
        id: doc.id,
        propertyId: doc.property_id,
        fileUrl: doc.file_url,
      });
      toast({
        title: "File deleted",
        description: `${doc.name} deleted successfully`,
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: `Failed to delete ${doc.name}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        )}
      >
        <input
          type="file"
          id={`file-upload-${propertyId}`}
          className="hidden"
          multiple
          accept="image/*,.pdf,.doc,.docx"
          onChange={handleFileSelect}
        />
        <label
          htmlFor={`file-upload-${propertyId}`}
          className="cursor-pointer flex flex-col items-center gap-2"
        >
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            {uploadDocument.isPending ? (
              <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
            ) : (
              <Upload className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-medium text-foreground">
              {isDragging ? "Drop files here" : "Upload documents"}
            </p>
            <p className="text-sm text-muted-foreground">
              Drag & drop or click to select (max 10MB)
            </p>
          </div>
        </label>
      </div>

      {/* Documents List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : documents.length > 0 ? (
        <div className="grid gap-2">
          {documents.map((doc) => {
            const FileIcon = getFileIcon(doc.file_type);
            const isImage = doc.file_type.startsWith("image/");

            return (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors group"
              >
                {isImage ? (
                  <img
                    src={doc.file_url}
                    alt={doc.name}
                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    <FileIcon className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate text-sm">
                    {doc.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(doc.file_size)}
                  </p>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => window.open(doc.file_url, "_blank")}
                  >
                    <FileText className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(doc)}
                    disabled={deleteDocument.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No documents uploaded yet
        </p>
      )}
    </div>
  );
}
