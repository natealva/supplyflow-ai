import { useState, useRef } from "react";
import { Upload, Image, Brain, Loader2, CheckCircle, X, Plus, Camera, FileText, Edit3, ChevronRight } from "lucide-react";
import { analyzePart, fileToBase64 } from "../lib/api";

export default function PartUpload({ onPartAnalyzed }) {
  const [images, setImages] = useState([]);       // { file, preview, base64Data }
  const [description, setDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [editedSpecs, setEditedSpecs] = useState(null);
  const [error, setError] = useState(null);
  const [agentMessages, setAgentMessages] = useState([]);
  const fileRef = useRef(null);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const newImages = [];
    for (const file of files) {
      const preview = URL.createObjectURL(file);
      const { data, mediaType } = await fileToBase64(file);
      newImages.push({ file, preview, base64Data: data, mediaType });
    }
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const runAnalysis = async () => {
    // Validate images have base64 data before sending
    const validImages = images.filter(img => img.base64Data && img.base64Data.length > 0);
    if (validImages.length === 0 && images.length > 0) {
      setError("Image data could not be read. Please re-upload your images.");
      return;
    }

    setAnalyzing(true);
    setError(null);
    setAgentMessages([]);

    // Simulate agent thinking steps while API call runs
    const steps = [
      "Examining uploaded images...",
      "Identifying part geometry and features...",
      "Analyzing surface finish requirements...",
      "Estimating material and manufacturing process...",
      "Determining dimensional envelope...",
      "Identifying attachment and NVH features...",
      "Compiling part specification sheet..."
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        setAgentMessages(prev => [...prev, steps[stepIdx]]);
        stepIdx++;
      }
    }, 800);

    try {
      const imagePayload = validImages.map(img => ({ data: img.base64Data, mediaType: img.mediaType || "image/png" }));
      const result = await analyzePart({ images: imagePayload, description });
      clearInterval(interval);
      setAgentMessages(prev => [...prev, "\u2705 Part analysis complete!"]);
      setAnalysis(result.analysis);
      setEditedSpecs(result.analysis);
    } catch (err) {
      clearInterval(interval);
      setError(err.message);
      setAgentMessages(prev => [...prev, `\u274C Error: ${err.message}`]);
    } finally {
      setAnalyzing(false);
    }
  };

  const updateSpec = (key, value) => {
    setEditedSpecs(prev => ({ ...prev, [key]: value }));
  };

  const updateNestedSpec = (parent, key, value) => {
    setEditedSpecs(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [key]: value }
    }));
  };

  const proceedToRFQ = () => {
    if (editedSpecs && onPartAnalyzed) {
      onPartAnalyzed({
        specs: editedSpecs,
        images: images.map(img => ({ preview: img.preview, base64Data: img.base64Data, mediaType: img.mediaType })),
        description
      });
    }
  };

  return (
    <div className="p-6 max-w-5xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">New Part Analysis</h2>
      <p className="text-gray-500 text-sm mb-6">Upload images and describe your part &mdash; AI will identify specs and requirements</p>

      {/* Step 1: Upload */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">1</span>
          Upload Part Images
        </h3>

        <div className="flex gap-4 flex-wrap mb-4">
          {images.map((img, i) => (
            <div key={i} className="relative group">
              <img src={img.preview} alt={`Part ${i + 1}`} className="w-40 h-40 object-cover rounded-lg border border-gray-200" />
              <button onClick={() => removeImage(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <X size={12} />
              </button>
            </div>
          ))}
          <button onClick={() => fileRef.current?.click()} className="w-40 h-40 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-blue-500 cursor-pointer">
            <Plus size={24} />
            <span className="text-xs font-medium">Add Image</span>
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
        <p className="text-xs text-gray-400">Upload photos, screenshots, or renders of your part. Multiple angles help improve analysis.</p>
      </div>

      {/* Step 2: Description */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">2</span>
          Describe the Part
          <span className="text-xs text-gray-400 font-normal">(optional but improves accuracy)</span>
        </h3>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="e.g., High gloss black B-pillar applique for the front door of an SUV. Needs to be flush with window glass. Injection molded, approximately 465mm long..."
          className="w-full h-28 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Analyze Button */}
      {!analysis && (
        <button
          onClick={runAnalysis}
          disabled={images.length === 0 || analyzing}
          className="mb-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium text-sm hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {analyzing ? <Loader2 size={18} className="animate-spin" /> : <Brain size={18} />}
          {analyzing ? "Analyzing Part..." : "Analyze Part with AI"}
        </button>
      )}

      {/* Agent Messages */}
      {agentMessages.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-5 font-mono text-sm space-y-1.5 max-h-64 overflow-y-auto mb-6">
          {agentMessages.map((msg, i) => (
            <div key={i} className={`${(msg || "").startsWith("\u2705") ? "text-green-400" : (msg || "").startsWith("\u274C") ? "text-red-400" : "text-gray-300"}`}>
              <span className="text-gray-500 mr-2">{"\u2192"}</span>{msg}
            </div>
          ))}
          {analyzing && <div className="text-blue-400 animate-pulse flex items-center gap-2"><Loader2 size={14} className="animate-spin" />Processing...</div>}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Step 3: Editable Specs */}
      {editedSpecs && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
          <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">3</span>
            Review & Edit Specifications
            <Edit3 size={14} className="text-gray-400" />
          </h3>
          <p className="text-xs text-gray-400 mb-5">AI-generated specs below. Edit any field to correct or refine.</p>

          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <SpecField label="Part Name" value={editedSpecs.partName} onChange={v => updateSpec("partName", v)} />
            <SpecField label="Part Type" value={editedSpecs.partType} onChange={v => updateSpec("partType", v)} />
            <SpecField label="Manufacturing Process" value={editedSpecs.process} onChange={v => updateSpec("process", v)} />
            <SpecField label="Primary Material" value={editedSpecs.material} onChange={v => updateSpec("material", v)} />
            <SpecField label="Surface Finish" value={editedSpecs.finish} onChange={v => updateSpec("finish", v)} />
            <SpecField label="Surface Class" value={editedSpecs.surfaceClass} onChange={v => updateSpec("surfaceClass", v)} />
            <SpecField label="Color Requirement" value={editedSpecs.colorRequirement} onChange={v => updateSpec("colorRequirement", v)} />
            <SpecField label="Gloss Requirement" value={editedSpecs.glossRequirement} onChange={v => updateSpec("glossRequirement", v)} />
            <SpecField label="Attachment Method" value={editedSpecs.attachmentMethod} onChange={v => updateSpec("attachmentMethod", v)} />
            <SpecField label="NVH Requirement" value={editedSpecs.nvhRequirement} onChange={v => updateSpec("nvhRequirement", v)} />
            <SpecField label="Est. Annual Volume" value={editedSpecs.estimatedAnnualVolume} onChange={v => updateSpec("estimatedAnnualVolume", v)} type="number" />
            <SpecField label="Est. Volume (cmÂ³)" value={editedSpecs.estimatedVolume_cm3} onChange={v => updateSpec("estimatedVolume_cm3", v)} type="number" />
          </div>

          <div className="border-t border-gray-100 mt-5 pt-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Estimated Dimensions (mm)</h4>
            <div className="grid grid-cols-3 gap-4">
              <SpecField label="Length" value={editedSpecs.estimatedDimensions?.length_mm} onChange={v => updateNestedSpec("estimatedDimensions", "length_mm", Number(v))} type="number" />
              <SpecField label="Width" value={editedSpecs.estimatedDimensions?.width_mm} onChange={v => updateNestedSpec("estimatedDimensions", "width_mm", Number(v))} type="number" />
              <SpecField label="Height" value={editedSpecs.estimatedDimensions?.height_mm} onChange={v => updateNestedSpec("estimatedDimensions", "height_mm", Number(v))} type="number" />
            </div>
          </div>

          <div className="border-t border-gray-100 mt-5 pt-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Tolerances</h4>
            <div className="grid grid-cols-2 gap-4">
              <SpecField label="General Tolerance" value={editedSpecs.tolerances?.general} onChange={v => updateNestedSpec("tolerances", "general", v)} />
              <SpecField label="Critical Tolerance" value={editedSpecs.tolerances?.critical} onChange={v => updateNestedSpec("tolerances", "critical", v)} />
            </div>
          </div>

          {editedSpecs.criticalFeatures && editedSpecs.criticalFeatures.length > 0 && (
            <div className="border-t border-gray-100 mt-5 pt-5">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Critical Features</h4>
              <div className="flex flex-wrap gap-2">
                {editedSpecs.criticalFeatures.map((f, i) => (
                  <span key={i} className="bg-orange-50 text-orange-700 text-xs px-2.5 py-1 rounded-full border border-orange-200">{f}</span>
                ))}
              </div>
            </div>
          )}

          {editedSpecs.notes && (
            <div className="border-t border-gray-100 mt-5 pt-5">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">AI Notes</h4>
              <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">{editedSpecs.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Proceed to RFQ */}
      {editedSpecs && (
        <button
          onClick={proceedToRFQ}
          className="bg-green-600 text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-green-700 transition-colors shadow-lg shadow-green-200 flex items-center gap-2"
        >
          <FileText size={18} />
          Generate RFQ Package
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}

function SpecField({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="text-xs text-gray-500 font-medium block mb-1">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
}
