import { useState, useRef } from "react";
import { Upload, FileText, Brain, Loader2, CheckCircle, X, Plus, Sparkles, ChevronRight, ArrowLeft, AlertTriangle, DollarSign } from "lucide-react";
import { extractQuote, generateMockQuotes, fileToBase64 } from "../lib/api";

export default function QuoteCollection({ rfqPackage, onProceedToComparison, onBack }) {
  const [quotes, setQuotes] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [agentMessages, setAgentMessages] = useState([]);
  const fileRef = useRef(null);

  const handlePDFUpload = async (e) => {
    const files = Array.from(e.target.files);
    setUploading(true);
    setError(null);

    for (const file of files) {
      try {
        setAgentMessages(prev => [...prev, `📄 Reading ${file.name}...`]);
        const { data } = await fileToBase64(file);
        setAgentMessages(prev => [...prev, `🔍 Extracting quote data from ${file.name}...`]);
        const result = await extractQuote({ pdfBase64: data, partSpecs: rfqPackage?.partSpecs });
        setAgentMessages(prev => [...prev, `✅ Successfully extracted quote from ${result.quote.supplierName}`]);
        setQuotes(prev => [...prev, { ...result.quote, sourceFile: file.name }]);
      } catch (err) {
        setAgentMessages(prev => [...prev, `❌ Failed to extract from ${file.name}: ${err.message}`]);
        setError(err.message);
      }
    }
    setUploading(false);
  };

  const handleGenerateMocks = async () => {
    setGenerating(true);
    setError(null);
    setAgentMessages(prev => [...prev, "🏭 Generating realistic supplier quotes..."]);
    setAgentMessages(prev => [...prev, "Creating varied supplier profiles (premium, specialist, cost-leader, niche)..."]);

    try {
      const result = await generateMockQuotes({ partSpecs: rfqPackage?.partSpecs, numSuppliers: 4 });
      setAgentMessages(prev => [...prev, `✅ Generated ${result.quotes.length} mock supplier quotes`]);
      const tagged = result.quotes.map(q => ({ ...q, sourceFile: "AI Generated (Demo)" }));
      setQuotes(prev => [...prev, ...tagged]);
    } catch (err) {
      setAgentMessages(prev => [...prev, `❌ Error: ${err.message}`]);
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const removeQuote = (idx) => {
    setQuotes(prev => prev.filter((_, i) => i !== idx));
  };

  const updateQuoteField = (idx, field, value) => {
    setQuotes(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
  const fmtK = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="p-6 max-w-6xl">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"><ArrowLeft size={16} />Back to RFQ Package</button>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Quote Collection</h2>
      <p className="text-gray-500 text-sm mb-6">Upload supplier quote PDFs or generate mock quotes for demo</p>

      {/* Upload & Generate Actions */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div
          onClick={() => !uploading && fileRef.current?.click()}
          className="bg-white rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors p-6 cursor-pointer flex flex-col items-center gap-3"
        >
          {uploading ? <Loader2 size={32} className="text-blue-500 animate-spin" /> : <Upload size={32} className="text-gray-400" />}
          <div className="text-center">
            <p className="font-medium text-gray-700 text-sm">{uploading ? "Extracting..." : "Upload Supplier Quote PDFs"}</p>
            <p className="text-xs text-gray-400 mt-1">AI will read and extract pricing, lead times, and terms</p>
          </div>
        </div>
        <input ref={fileRef} type="file" accept=".pdf" multiple onChange={handlePDFUpload} className="hidden" />

        <div
          onClick={() => !generating && handleGenerateMocks()}
          className="bg-white rounded-xl border-2 border-dashed border-purple-300 hover:border-purple-400 hover:bg-purple-50 transition-colors p-6 cursor-pointer flex flex-col items-center gap-3"
        >
          {generating ? <Loader2 size={32} className="text-purple-500 animate-spin" /> : <Sparkles size={32} className="text-purple-400" />}
          <div className="text-center">
            <p className="font-medium text-gray-700 text-sm">{generating ? "Generating..." : "Generate Mock Quotes (Demo)"}</p>
            <p className="text-xs text-gray-400 mt-1">AI creates 4 realistic supplier quotes for demonstration</p>
          </div>
        </div>
      </div>

      {/* Agent Messages */}
      {agentMessages.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-5 font-mono text-sm space-y-1.5 max-h-48 overflow-y-auto mb-6">
          {agentMessages.map((msg, i) => (
            <div key={i} className={`${msg.startsWith("✅") ? "text-green-400" : msg.startsWith("❌") ? "text-red-400" : "text-gray-300"}`}>
              <span className="text-gray-500 mr-2">→</span>{msg}
            </div>
          ))}
          {(uploading || generating) && <div className="text-blue-400 animate-pulse flex items-center gap-2"><Loader2 size={14} className="animate-spin" />Processing...</div>}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Collected Quotes */}
      {quotes.length > 0 && (
        <>
          <h3 className="font-semibold text-gray-800 mb-4">Collected Quotes ({quotes.length})</h3>
          <div className="space-y-4 mb-6">
            {quotes.map((q, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <DollarSign size={16} className="text-green-600" />
                    <span className="font-semibold text-gray-800">{q.supplierName}</span>
                    <span className="text-xs text-gray-400">{q.supplierLocation}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">{q.sourceFile}</span>
                    <button onClick={() => removeQuote(idx)} className="text-gray-400 hover:text-red-500"><X size={16} /></button>
                  </div>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <QuoteField label="Unit Price" value={q.unitPrice} onChange={v => updateQuoteField(idx, "unitPrice", Number(v))} type="number" prefix="$" highlight />
                    <QuoteField label="Tooling Cost" value={q.toolingCost} onChange={v => updateQuoteField(idx, "toolingCost", Number(v))} type="number" prefix="$" />
                    <QuoteField label="Lead Time" value={q.leadTime_weeks} onChange={v => updateQuoteField(idx, "leadTime_weeks", Number(v))} type="number" suffix=" weeks" />
                    <QuoteField label="MOQ" value={q.moq} onChange={v => updateQuoteField(idx, "moq", Number(v))} type="number" />
                  </div>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <QuoteField label="PPAP Timeline" value={q.ppapTimeline_weeks} onChange={v => updateQuoteField(idx, "ppapTimeline_weeks", Number(v))} type="number" suffix=" weeks" />
                    <QuoteField label="Capacity/Week" value={q.capacityPerWeek} onChange={v => updateQuoteField(idx, "capacityPerWeek", Number(v))} type="number" />
                    <QuoteField label="Material" value={q.materialQuoted} onChange={v => updateQuoteField(idx, "materialQuoted", v)} />
                    <QuoteField label="Process" value={q.processQuoted} onChange={v => updateQuoteField(idx, "processQuoted", v)} />
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <QuoteField label="Freight Terms" value={q.freightTerms} onChange={v => updateQuoteField(idx, "freightTerms", v)} />
                    <QuoteField label="Payment Terms" value={q.paymentTerms} onChange={v => updateQuoteField(idx, "paymentTerms", v)} />
                    <QuoteField label="Validity" value={q.validityPeriod} onChange={v => updateQuoteField(idx, "validityPeriod", v)} />
                  </div>
                  {q.notes && <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">{q.notes}</p>}
                  {q.risks && q.risks.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {q.risks.map((r, i) => (
                        <span key={i} className="bg-red-50 text-red-600 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle size={10} />{r}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Proceed to Comparison */}
          <button
            onClick={() => onProceedToComparison(quotes)}
            className="bg-green-600 text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-green-700 transition-colors shadow-lg shadow-green-200 flex items-center gap-2"
          >
            <Brain size={18} />
            Run AI Quote Comparison
            <ChevronRight size={16} />
          </button>
        </>
      )}
    </div>
  );
}

function QuoteField({ label, value, onChange, type = "text", prefix, suffix, highlight }) {
  return (
    <div>
      <label className="text-xs text-gray-400 block mb-1">{label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{prefix}</span>}
        <input
          type={type}
          value={value ?? ""}
          onChange={e => onChange(e.target.value)}
          className={`w-full border border-gray-200 rounded-lg ${prefix ? "pl-7" : "px-3"} py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${highlight ? "font-semibold text-green-700 bg-green-50 border-green-200" : ""}`}
        />
      </div>
    </div>
  );
}
