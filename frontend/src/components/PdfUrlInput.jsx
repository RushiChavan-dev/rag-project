// File: PdfUrlInput.jsx
import React from "react";

/**
 * PdfUrlInput Component
 * Props:
 * - url: string
 * - onUrlChange: (e) => void
 * - onSubmit: () => void
 * - uploading: boolean
 */
const PdfUrlInput = ({ url, onUrlChange, onSubmit, uploading }) => (
  <div className="mt-4">
    <input
      type="url"
      placeholder="Enter PDF URL"
      value={url}
      onChange={onUrlChange}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
    />
    <button
      onClick={onSubmit}
      className="mt-2 w-full bg-primary-blue text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
      disabled={uploading}
    >
      {uploading ? "Uploading..." : "Submit PDF URL"}
    </button>
  </div>
);

export default PdfUrlInput;
