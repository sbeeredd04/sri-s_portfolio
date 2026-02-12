/**
 * ResponsiveModal Component
 * 
 * A reusable modal component with responsive sizing and smooth animations.
 * Perfect for previewing content like resumes or project details.
 * 
 * @component
 * @example
 * <ResponsiveModal
 *   isOpen={showResumePreview}
 *   onClose={() => setShowResumePreview(false)}
 *   content={<iframe src="/resume.pdf" />}
 *   title="Resume Preview"
 *  showDownloadButton
 *  downloadHref="/sri_resume.pdf"
 * />
 */

import { IconPlus, IconDownload } from "@tabler/icons-react";
import Link from "next/link";

export function ResponsiveModal({
  isOpen = false,
  onClose,
  content,
  title = "",
  showDownloadButton = false,
  downloadHref = "",
  onDownloadClick = null,
  customHeader = null,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-[90%] h-[90%] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
          <h2 className="text-lg md:text-2xl font-bold text-gray-800">{title}</h2>
          {customHeader}
          <div className="flex items-center gap-2">
            {showDownloadButton && downloadHref && (
              <Link
                href={downloadHref}
                download
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownloadClick?.();
                }}
              >
                <IconDownload size={18} strokeWidth={2} />
                Download
              </Link>
            )}
            <button
              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              onClick={onClose}
            >
              <IconPlus className="rotate-45" size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-white">
          {content}
        </div>
      </div>
    </div>
  );
}
