// API helper for calling Vercel serverless functions
const API_BASE = "/api";

export async function analyzePart({ images, description }) {
  const res = await fetch(`${API_BASE}/analyze-part`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ images, description }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to analyze part");
  }
  return res.json();
}

export async function extractQuote({ pdfBase64, partSpecs }) {
  const res = await fetch(`${API_BASE}/extract-quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pdfBase64, partSpecs }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to extract quote");
  }
  return res.json();
}

export async function generateMockQuotes({ partSpecs, numSuppliers = 4 }) {
  const res = await fetch(`${API_BASE}/generate-mock-quotes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ partSpecs, numSuppliers }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to generate mock quotes");
  }
  return res.json();
}

// Convert a File to base64
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      resolve({ data: base64, mediaType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
