const BASE_URL = import.meta.env.VITE_API_URL;

// Query about the PDF
async function queryRAG(message, top_k = 3) {
  const res = await fetch(`${BASE_URL}/api/query/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: message, top_k }),
  });

  if (!res.ok) {
    return Promise.reject({ status: res.status, data: await res.json() });
  }

  return res.body; // Return response body for streaming
}

// Function to upload PDF from a URL
async function uploadPDFUrl(fileUrl) {
  const formData = new FormData();
  formData.append("file_url", fileUrl);

  const res = await fetch(`${BASE_URL}/api/upload-pdf-from-url/`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    return Promise.reject({ status: res.status, data: await res.json() });
  }

  return res.json(); // Return response as JSON
}

// Processing uploaded pdf function
async function processDocument() {
  console.log(`${BASE_URL}/api/process/`);
  console.log(`${BASE_URL}`);
  try {
    const response = await fetch(`${BASE_URL}/api/process/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Failed to process document");
    }
    return await response.json();
  } catch (error) {
    console.error("Error processing document:", error);
    throw error;
  }
}

// Upload PDF function
async function uploadPDF(file) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(`${BASE_URL}/api/upload-pdf/`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload PDF");
    }

    return await response.json();
  } catch (error) {
    console.error("File upload error:", error);
    throw error;
  }
}

/**
 * Upload an HTML website URL for processing.
 * @param {string} url - The URL of the HTML website to process.
 * @returns {Promise<Object>} - The response from the server.
 */
async function uploadHtmlUrl(url) {
  const res = await fetch(`${BASE_URL}/api/process-html/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }), // Send the URL in the request body
  });

  if (!res.ok) {
    return Promise.reject({ status: res.status, data: await res.json() });
  }

  return res.json(); // Return the parsed JSON response
}

// 1. Upload multiple demand documents (PDF, DOCX, PNG, etc.)
async function uploadDemandDocs(files) {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

  const res = await fetch(`${BASE_URL}/api/upload-demand-docs/`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    return Promise.reject({ status: res.status, data: await res.json() });
  }

  return res.json(); // { uploaded: [...] }
}

// 2. Process all uploaded demand documents (LLM extraction + vector indexing)
async function processDemandDocs() {
  const res = await fetch(`${BASE_URL}/api/process-demand-docs/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    return Promise.reject({ status: res.status, data: await res.json() });
  }

  return res.json(); // { status, documents_loaded, chunks_indexed, ... }
}

// 3. Generate a demand letter (RAG-based generation)
async function generateDemandLetter(query = "q", top_k = 5) {
  const res = await fetch(`${BASE_URL}/api/generate-demand-letter/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, top_k }),
  });

  // ✅ Log the full response

  if (!res.ok) {
    return Promise.reject({ status: res.status, data: await res.json() });
  }
  console.log("📬 Full demand letter response:", res.body);
  return res.body; // Return response body for streaming
}

// 4. Clear all uploaded demand documents and related artifacts
async function clearDemandDocs() {
  const res = await fetch(`${BASE_URL}/api/clear-demand-docs/`, {
    method: "DELETE",
  });

  if (!res.ok) {
    return Promise.reject({ status: res.status, data: await res.json() });
  }

  return res.json(); // { deleted: [...], errors?: [...] }
}

// 5. List all uploaded demand document filenames
async function listDemandDocs() {
  const res = await fetch(`${BASE_URL}/api/list-demand-docs/`, {
    method: "GET",
  });

  if (!res.ok) {
    return Promise.reject({ status: res.status, data: await res.json() });
  }

  return res.json(); // { files: [...] }
}

// 6. Delete a specific document by filename
async function deleteDemandDoc(filename) {
  const res = await fetch(
    `${BASE_URL}/api/delete-demand-doc/?filename=${encodeURIComponent(
      filename
    )}`,
    {
      method: "DELETE",
    }
  );

  if (!res.ok) {
    return Promise.reject({ status: res.status, data: await res.json() });
  }

  return res.json(); // { deleted: "filename" }
}

export default {
  processDocument,
  uploadPDF,
  queryRAG,
  uploadPDFUrl,
  uploadHtmlUrl,
  uploadDemandDocs,
  processDemandDocs,
  generateDemandLetter,
  clearDemandDocs,
  listDemandDocs,
  deleteDemandDoc,
};
