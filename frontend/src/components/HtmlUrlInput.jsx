// File: HtmlUrlInput.jsx
import React from "react";

/**
 * HtmlUrlInput Component
 * Props:
 * - htmlUrl: string
 * - onHtmlUrlChange: (e) => void
 * - onSubmit: () => void
 * - uploading: boolean
 */
const HtmlUrlInput = ({ htmlUrl, onHtmlUrlChange, onSubmit, uploading }) => (
  <div className="mt-4">
    <input
      type="url"
      placeholder="Enter HTML Website URL"
      value={htmlUrl}
      onChange={onHtmlUrlChange}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
    />
    <button
      onClick={onSubmit}
      className="mt-2 w-full bg-primary-blue text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
      disabled={uploading}
    >
      {uploading ? "Processing..." : "Submit HTML URL"}
    </button>
  </div>
);

export default HtmlUrlInput;
