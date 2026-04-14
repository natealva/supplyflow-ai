// API helper for calling Vercel serverless functions
const API_BASE = "/api";

async function safeParseError(res, fallbackMsg) {
  try {
    const data = await res.json();
    return data.error || fallbackMsg;
  } catch {
    try {
      const text = await res.text();
      return text.slice(0, 200) || fallbackMsg;
    } catch {
      return fallbackMsg;
    }
  }
}

export async function analyzePart({ images, description }) {
  const res = await fetch(`${API_BASE}/analyze-part`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ images, description }),
  });
  if (!res.ok) {
    const msg = await safeParseError(res, "Failed to analyze part");
    throw new Error(msg);
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
    const msg = await safeParseError(res, "Failed to extract quote");
    throw new Error(msg);
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
    const msg = await safeParseError(res, "Failed to generate mock quotes");
    throw new Error(msg);
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
