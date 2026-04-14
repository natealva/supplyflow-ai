import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { images, description } = req.body;

    // Build content array with images and text
    const content = [];

    if (images && images.length > 0) {
      for (const img of images) {
        content.push({
          type: "image",
          source: { type: "base64", media_type: img.mediaType || "image/png", data: img.data }
        });
      }
    }

    content.push({
      type: "text",
      text: `You are an expert automotive manufacturing engineer analyzing a part for an RFQ (Request for Quote) package.

${description ? `The user described this part as: "${description}"` : "Analyze the part shown in the images."}

Based on the images and description, identify and return a JSON object with the following fields. Make your best engineering estimates where you can't be certain. Return ONLY valid JSON, no markdown:

{
  "partName": "descriptive name of the part",
  "partType": "type category (e.g., Exterior Trim, Structural Bracket, Housing, etc.)",
  "process": "primary manufacturing process (e.g., Injection Molding, Stamping, Die Casting, etc.)",
  "material": "likely material (e.g., PC-ABS, Aluminum 6061, Steel 1018, etc.)",
  "materialAlternates": ["alternate material option 1", "alternate material option 2"],
  "finish": "surface finish (e.g., Molded in Color, Painted, Chrome Plated, Anodized, etc.)",
  "finishAlternates": ["alternate finish 1"],
  "estimatedDimensions": { "length_mm": 0, "width_mm": 0, "height_mm": 0 },
  "estimatedVolume_cm3": 0,
  "surfaceClass": "A, B, or C",
  "colorRequirement": "e.g., Piano Black, Body Color, Natural, etc.",
  "glossRequirement": "e.g., >90 GU, Matte, Textured, etc.",
  "attachmentMethod": "e.g., Clips, Threaded Fasteners, Adhesive, Snap Fit, etc.",
  "attachmentAlternate": "alternate attachment method",
  "nvhRequirement": "e.g., PUR Foam, SEBS Foam, None, etc.",
  "criticalFeatures": ["list of key features or requirements"],
  "tolerances": { "general": "±0.5 mm", "critical": "±0.2 mm" },
  "estimatedAnnualVolume": 50000,
  "suggestedQualityRequirements": ["IATF 16949 required", "other requirements"],
  "notes": "any additional observations about the part"
}`
    });

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content }]
    });

    const text = response.content[0].text;
    // Try to parse as JSON, handle potential markdown wrapping
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      parsed = match ? JSON.parse(match[1]) : JSON.parse(text.trim());
    }

    res.status(200).json({ analysis: parsed });
  } catch (error) {
    console.error("Part analysis error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze part" });
  }
}
