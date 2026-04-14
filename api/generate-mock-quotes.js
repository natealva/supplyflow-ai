import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { partSpecs, numSuppliers = 4 } = req.body;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{
        role: "user",
        content: `You are an expert procurement engineer. Generate ${numSuppliers} realistic but fictional supplier quotes for the following part:

${JSON.stringify(partSpecs, null, 2)}

Create varied, realistic quotes from different types of suppliers:
- One premium/large tier-1 supplier (higher price, best quality/delivery)
- One mid-range specialist supplier (competitive on this specific part type)
- One cost-leader supplier (lowest price, some trade-offs on lead time or quality)
- One additional supplier with a unique value proposition

For each supplier, generate a complete quote. Return ONLY a valid JSON array, no markdown:

[
  {
    "supplierName": "realistic fictional company name",
    "supplierLocation": "city, state/country",
    "quoteDate": "2026-04-10",
    "quoteNumber": "QT-XXXX-XX",
    "concept": "manufacturing approach quoted",
    "unitPrice": 0.00,
    "toolingCost": 0,
    "moq": 0,
    "leadTime_weeks": 0,
    "ppapTimeline_weeks": 0,
    "capacityPerWeek": 0,
    "materialQuoted": "specific material grade",
    "processQuoted": "specific process",
    "finishQuoted": "specific finish/coating",
    "packagingIncluded": true,
    "freightTerms": "FOB or DDP etc.",
    "paymentTerms": "Net 30 etc.",
    "validityPeriod": "90 days",
    "notes": "1-2 sentences about their approach or value-add",
    "risks": ["any potential concerns"]
  }
]

Make the pricing, lead times, and capabilities realistic for automotive manufacturing. Vary the approaches — some might quote molded-in-color, others might quote painted, etc.`
      }]
    });

    const text = response.content[0].text;
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      parsed = match ? JSON.parse(match[1]) : JSON.parse(text.trim());
    }

    res.status(200).json({ quotes: parsed });
  } catch (error) {
    console.error("Mock quote generation error:", error);
    res.status(500).json({ error: error.message || "Failed to generate mock quotes" });
  }
}
