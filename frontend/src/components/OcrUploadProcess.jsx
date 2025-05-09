import React, { useState } from "react";
import api from "../api";

const OcrUploadProcess = () => {
  const [files, setFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [demandLetter, setDemandLetter] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showFiles, setShowFiles] = useState(false);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    try {
      const res = await api.uploadDemandDocs(files);
      console.log("Uploaded:", res.uploaded);
      setFiles([]);
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  const handleProcess = async () => {
    setProcessing(true);
    try {
      const res = await api.processDemandDocs();
      console.log("Processed:", res);
    } catch (err) {
      console.error("Processing failed:", err);
    } finally {
      setProcessing(false);
    }
  };

  const handleShowFiles = async () => {
    try {
      const res = await api.listDemandDocs();
      setUploadedFiles(res.files);
      setShowFiles(true);
    } catch (err) {
      console.error("Failed to list documents:", err);
    }
  };

  const handleDeleteFile = async (filename) => {
    try {
      await api.deleteDemandDoc(filename);
      setUploadedFiles((prev) => prev.filter((f) => f !== filename));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleClearAll = async () => {
    try {
      await api.clearDemandDocs();
      setUploadedFiles([]);
      setDemandLetter(null);
      setShowFiles(false);
    } catch (err) {
      console.error("Failed to clear documents:", err);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setUploadedFiles([]);
    setDemandLetter(null);
    setShowFiles(false);
    setProcessing(false);
  };

  return (
    <div className="space-y-4 p-4 max-w-xl mx-auto">
      <input type="file" multiple onChange={handleFileChange} />
      {files.length > 0 && (
        <ul className="list-disc pl-5">
          {files.map((file, idx) => (
            <li key={idx}>{file.name}</li>
          ))}
        </ul>
      )}

      <button
        onClick={handleUpload}
        disabled={files.length === 0}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Upload Files
      </button>

      <button
        onClick={handleProcess}
        disabled={processing}
        className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        {processing ? "Processing..." : "Process Demand Docs"}
      </button>

      <button
        onClick={handleShowFiles}
        className="w-full bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
      >
        Show Uploaded Documents
      </button>

      {showFiles && uploadedFiles.length > 0 && (
        <ul className="bg-gray-100 p-4 rounded shadow">
          {uploadedFiles.map((file, idx) => (
            <li key={idx} className="flex justify-between items-center mb-1">
              <span>{file}</span>
              <button
                onClick={() => handleDeleteFile(file)}
                className="text-red-500 hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={handleClearAll}
        className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Delete All Uploaded Docs
      </button>

      {demandLetter && (
        <div className="bg-white p-4 rounded shadow mt-6">
          <h2 className="text-lg font-bold mb-2">Generated Demand Letter:</h2>
          <pre className="whitespace-pre-wrap text-sm">{demandLetter}</pre>
        </div>
      )}

      <button
        onClick={handleReset}
        className="w-full bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
      >
        Start Again
      </button>
    </div>
  );
};

export default OcrUploadProcess;
