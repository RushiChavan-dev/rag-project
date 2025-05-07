import { useState, useEffect } from "react";
import { FaFilePdf } from "react-icons/fa"; // Import a PDF file icon from react-icons
import api from "@/api"; // Import API functions
import { useLocation } from "react-router-dom";
import OcrUploadProcess from "./OcrUploadProcess";
import FileUpload from "./FileUpload";
import HtmlUrlInput from "./HtmlUrlInput";
import PdfUrlInput from "./PdfUrlInput";

function LeftSidePanel() {
  const { pathname } = useLocation();
  const [file, setFile] = useState(null);
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [url, setUrl] = useState("");
  const [processing, setProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isHtmlMode, setIsHtmlMode] = useState(false); // New state for HTML mode
  const [htmlUrl, setHtmlUrl] = useState(""); // New state for HTML URL

  const routeModes = {
    "/": ["summary"], // Home page
    "/ocr": ["ocr"], // OCR-only page
    // "/translate": ["translate", "summary"], // New page example
    // add more routes as you spin them up...
  };
  const availableModes =
    routeModes[pathname] ??
    Object.values(routeModes)
      .flat()
      .filter((v, i, a) => a.indexOf(v) === i);
  const [mode, setMode] = useState(availableModes[0]);
  const showManualSwitcher = availableModes.length > 1;

  useEffect(() => {
    // 1️⃣ log before anything else
    console.log(
      `🧭 Navigated to ${location.pathname}; ` +
        `availableModes = [${availableModes.join(", ")}], ` +
        `defaulting to "${availableModes[0]}"`
    );

    // 2️⃣ now actually update your state
    setMode(availableModes[0]);
  }, [availableModes]);

  // ==== Upload PDF FILE START ===
  // Handle file selection and upload
  const handlePDFFileUpload = async (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile || uploadedFile.type !== "application/pdf") {
      alert("Please upload a valid PDF file.");
      return;
    }

    // Sanitize filename: remove spaces and disallowed characters
    let fileName = uploadedFile.name.replace(/\s+/g, ""); // Remove spaces
    fileName = fileName.replace(/[^a-zA-Z0-9_.-]/g, ""); // Keep only safe characters

    // Ensure it starts with a lowercase letter
    if (!/^[a-z]/.test(fileName)) {
      fileName = "a" + fileName; // Prepend 'a' if it doesn't start with lowercase
    }

    // Create a new File object with the modified name
    const modifiedFile = new File([uploadedFile], fileName, {
      type: uploadedFile.type,
    });

    setFile(modifiedFile);
    await uploadFile(modifiedFile);
  };

  // Upload file via API
  const uploadFile = async (selectedFile) => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const response = await api.uploadPDF(selectedFile);

      if (response?.filename) {
        alert(`Upload Successful: ${response.filename}`);
      } else {
        throw new Error("Unexpected response from server.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload PDF.");
    } finally {
      setUploading(false);
    }
  };

  // ==== Upload PDF FILE END ===

  // Handle URL input change
  const handleUrlChange = (event) => {
    setUrl(event.target.value);
  };

  const handleUrlSubmit = async () => {
    // Basic URL validation
    try {
      new URL(url); // This will throw an error if the URL is invalid
    } catch (error) {
      console.error("Error: ", error);
      alert("Please enter a valid URL.");
      return;
    }

    if (!url) {
      alert("Please enter a valid URL.");
      return;
    }

    setUploading(true);
    try {
      const response = await api.uploadPDFUrl(url);
      if (response?.filename) {
        alert(
          `PDF Name : ${response.filename} \nStatus : ${response.status} in DB`
        );
      } else {
        throw new Error("Unexpected response from server.");
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF from URL.");
    } finally {
      setUploading(false);
    }
  };

  // Handle HTML URL input change
  const handleHtmlUrlChange = (event) => {
    setHtmlUrl(event.target.value);
  };

  // Handle HTML URL submission
  const handleHtmlUrlSubmit = async () => {
    // Basic URL validation
    try {
      new URL(htmlUrl); // This will throw an error if the URL is invalid
    } catch (error) {
      console.error("Error: ", error);
      alert("Please enter a valid HTML website URL.");
      return;
    }

    if (!htmlUrl) {
      alert("Please enter a valid HTML website URL.");
      return;
    }

    setUploading(true);
    try {
      // Call the API to process the HTML website URL
      const response = await api.uploadHtmlUrl(htmlUrl);

      // Check if the response contains the expected message
      if (response?.message) {
        alert(`Success: ${response.message}`);
      } else {
        throw new Error("Unexpected response from server.");
      }
    } catch (error) {
      console.error("Error processing HTML website:", error);

      // Display a user-friendly error message
      if (error.status === 400) {
        alert("Invalid URL provided. It must start with http:// or https://");
      } else if (error.status === 500) {
        alert("Failed to process the HTML website. Please try again later.");
      } else {
        alert("Failed to process HTML website.");
      }
    } finally {
      setUploading(false);
    }
  };

  // Process document function
  const handleProcess = async () => {
    setProcessing(true);
    try {
      console.log("Processing started...");
      const data = await api.processDocument(); // Use function directly
      alert(data.message);
    } catch (error) {
      console.error("Error in processing:", error);
      alert("Error processing documents.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="w-1/4 bg-gray-50 p-6 border-r border-gray-200">
      {showManualSwitcher && (
        <div className="mode-switcher">
          {availableModes.map((m) => (
            <label key={m} className="mr-4">
              <input
                type="radio"
                name="mode"
                value={m}
                checked={mode === m}
                onChange={() => setMode(m)}
              />{" "}
              {m.toUpperCase()}
            </label>
          ))}
        </div>
      )}
      <div className="mt-6 font-urbanist text-primary-blue text-xl font-light">
        <p>Please Upload File or Enter URL!</p>
      </div>
      {mode === "ocr" && <OcrUploadProcess />}
      {mode === "summary" && (
        <>
          <div className="mt-4 flex items-center space-x-2">
            <input
              type="checkbox"
              id="toggle-mode"
              checked={isUrlMode}
              onChange={() => {
                setIsUrlMode(!isUrlMode);
                setIsHtmlMode(false);
              }}
              className="w-4 h-4"
            />
            <label htmlFor="toggle-mode" className="text-sm text-gray-700">
              Enter PDF URL instead of uploading a file
            </label>
          </div>
          <div className="mt-4 flex items-center space-x-2">
            <input
              type="checkbox"
              id="toggle-html-mode"
              checked={isHtmlMode}
              onChange={() => {
                setIsHtmlMode(!isHtmlMode);
                setIsUrlMode(false);
              }}
              className="w-4 h-4"
            />
            <label htmlFor="toggle-html-mode" className="text-sm text-gray-700">
              Enter HTML Website URL
            </label>
          </div>
          {isUrlMode && (
            <PdfUrlInput
              url={url}
              onUrlChange={handleUrlChange}
              onSubmit={handleUrlSubmit}
              uploading={uploading}
            />
          )}
          {isHtmlMode && (
            <HtmlUrlInput
              htmlUrl={htmlUrl}
              onHtmlUrlChange={handleHtmlUrlChange}
              onSubmit={handleHtmlUrlSubmit}
              uploading={uploading}
            />
          )}
          {!isUrlMode && !isHtmlMode && (
            <FileUpload
              file={file}
              onFileChange={handlePDFFileUpload}
              uploading={uploading}
            />
          )}
          {!isHtmlMode && (
            <button
              onClick={handleProcess}
              className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              disabled={processing}
            >
              {processing ? "Processing..." : "Process"}
            </button>
          )}
        </>
      )}
      {mode === "translate" && <p>Translation Mode UI goes here</p>}
      {!["ocr", "summary", "translate"].includes(mode) && (
        <p>Default Mode UI goes here</p>
      )}
    </div>
  );
}

export default LeftSidePanel;
