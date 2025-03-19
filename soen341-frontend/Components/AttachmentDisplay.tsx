import React from "react";
import {
  Download,
  FileText,
  Image,
  Film,
  Music,
  Archive,
  File,
} from "lucide-react";

interface Attachment {
  id: string;
  fileName: string;
  originalFileName: string;
  fileUrl: string;
  contentType: string;
  size: number;
}

interface AttachmentDisplayProps {
  attachments: Attachment[];
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const getFileIcon = (contentType: string) => {
  if (contentType.startsWith("image/")) return <Image className="h-4 w-4" />;
  if (contentType.startsWith("video/")) return <Film className="h-4 w-4" />;
  if (contentType.startsWith("audio/")) return <Music className="h-4 w-4" />;
  if (contentType.startsWith("text/")) return <FileText className="h-4 w-4" />;
  if (
    contentType.includes("zip") ||
    contentType.includes("compressed") ||
    contentType.includes("archive")
  )
    return <Archive className="h-4 w-4" />;
  return <File className="h-4 w-4" />;
};

const isImage = (contentType: string) => {
  return contentType.startsWith("image/");
};

export const AttachmentDisplay: React.FC<AttachmentDisplayProps> = ({
  attachments,
}) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="mt-2 space-y-2">
      {attachments.map((attachment) => (
        <div key={attachment.id}>
          {isImage(attachment.contentType) ? (
            <div className="relative group">
              <img
                src={`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}${attachment.fileUrl}`}
                alt={attachment.originalFileName}
                className="max-h-96 max-w-full rounded-md object-contain"
              />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}${attachment.fileUrl}`}
                  download={attachment.originalFileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                >
                  <Download className="h-4 w-4 text-white" />
                </a>
              </div>
            </div>
          ) : (
            <div className="flex items-center p-2 bg-[#2a2d58]/60 rounded-md hover:bg-[#2a2d58] transition-colors">
              <div className="mr-2 text-gray-300">
                {getFileIcon(attachment.contentType)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-300 truncate">
                  {attachment.originalFileName}
                </p>
                <p className="text-xs text-gray-400">
                  {formatFileSize(attachment.size)}
                </p>
              </div>
              <a
                href={`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}${attachment.fileUrl}`}
                download={attachment.originalFileName}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 p-1 hover:bg-white/10 rounded-md"
              >
                <Download className="h-4 w-4 text-gray-300" />
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
