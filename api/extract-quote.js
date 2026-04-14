import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { pdfBase64, partSpecs } = req.body;

    const content = [];

    if (pdfBase64) {
      content.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: pdfBase64 }
      });
    }

    content.push({
      type: "text",
      text: `You are an expert procurement engineer extracting data from a supplier quote document.

The quote is for this part:
${JSON.stringify(partSpecs, null, 2)}

Extract the following information from the quote document and return ONLY valid JSON, no markdown:

{
  "supplierName": "name of the quoting supplier",
  "supplierLocation": "city, state/country",
  "quoteDate": "YYYY-MM-DD",
  "quoteNumber": "quote reference number if visible",
  "concept": "manufacturing concept quoted (e.g., Basic MIC, Painted, etc.)",
  "unitPrice": 0.00,
  "toolingCost": 0,
  "moq": 0,
  "leadTime_weeks": 0,
  "ppapTimeline_weeks": 0,
  "capacityPerWeek": 0,
  "materialQuoted": "material specified in quote",
  "processQuoted": "manufacturing process",
  "finishQuoted": "finish/coating specified",
  "packagingIncluded": true,
  "freightTerms": "e.g., FOB Origin, DDP, etc.",
  "paymentTerms": "e.g., Net 30, Net 60",
  "validityPeriod": "e.g., 90 days",
  "notes": "any additional terms, conditions, or observations",
  "risks": ["any red flags or concerns noted in the quote"]
}`
    });

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content }]
    });

    const text = response.content[0].text;
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      parsed = match ? JSON.parse(match[1]) : JSON.parse(text.trim());
    }

    res.status(200).json({ quote: parsed });
  } catch (error) {
    console.error("Quote extraction error:", error);
    res.status(500).json({ error: error.message || "Failed to extract quote" });
  }
}
