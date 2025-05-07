// File: OcrUploadProcess.jsx
import React, { useState } from "react";

/**
 * OcrUploadProcess Component
 * Handles multiple file uploads for OCR mode
 */
const OcrUploadProcess = () => {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);

  const handleFileUpload = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleFileProcessing = () => {
    setProcessing(true);
    console.log("Processing files...", files);
    // Add OCR process logic here
  };

  const handleStartAgain = () => {
    setFiles([]);
    setProcessing(false);
  };

  return (
    <div>
      <input
        type="file"
        multiple
        onChange={handleFileUpload}
        disabled={processing}
        className="mt-4"
      />

      {files.length > 0 && (
        <div className="mt-4">
          <p>Uploaded Files:</p>
          <ul className="list-disc list-inside">
            {files.map((file, idx) => (
              <li key={idx}>{file.name}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={handleFileProcessing}
        disabled={files.length === 0 || processing}
        className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
      >
        {processing ? "Processing..." : "Process"}
      </button>

      <button
        onClick={handleStartAgain}
        className="mt-2 w-full bg-gray-300 text-black px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
      >
        Start Again
      </button>
    </div>
  );
};

export default OcrUploadProcess;
