// File: FileUpload.jsx
import React from "react";
import { FaFilePdf } from "react-icons/fa";

// Utility to format file sizes into human-readable strings
const formatFileSize = (size) => {
  if (size < 1024) return `${size} Bytes`;
  const kb = size / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
};

/**
 * FileUpload Component
 * Props:
 * - file: File | null
 * - onFileChange: (e) => void
 * - uploading: boolean
 */
const FileUpload = ({ file, onFileChange, uploading }) => (
  <div>
    {/* Upload Button */}
    <label className="mt-4 cursor-pointer bg-primary-blue text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors block text-center">
      Upload PDF
      <input
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={onFileChange}
      />
    </label>

    {/* Display Selected File */}
    {file && (
      <div className="mt-4 flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
        <div className="text-red-600">
          <FaFilePdf className="w-8 h-8" />
        </div>
        <div>
          <p className="text-sm font-medium text-main-text">{file.name}</p>
          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
        </div>
      </div>
    )}

    {/* Uploading Indicator */}
    {uploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
  </div>
);

export default FileUpload;
