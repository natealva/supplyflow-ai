import { useState } from "react";
import { FileText, CheckCircle, Edit3, Plus, X, Truck, Shield, Package, ChevronRight, ArrowLeft, Printer } from "lucide-react";

const DEFAULT_QUALITY_REQS = [
  "IATF 16949 certification required",
  "No visible flow lines, sink marks, or weld lines on A-surface",
  "Salt spray resistance: 96 hours minimum",
  "UV resistance: SAE J2527, 2500 kJ/m² minimum"
];

const DEFAULT_DELIVERY_REQS = [
  "Packaging: Returnable dunnage with individual part separation",
  "Delivery frequency: JIT, daily delivery within 4-hour window",
  "Safety stock: 2 days at assembly plant"
];

const DEFAULT_DOCS = [
  "PPAP Level 3 submission",
  "Control Plan",
  "PFMEA",
  "Measurement System Analysis (MSA)",
  "Initial Process Study (Cpk ≥ 1.67)"
];

export default function RFQBuilder({ partData, onProceedToQuotes, onBack }) {
  const specs = partData?.specs || {};
  const images = partData?.images || [];

  const [projectName, setProjectName] = useState(specs.partName ? `${specs.partName} — RFQ Package` : "New Part RFQ Package");
  const [programCode, setProgramCode] = useState("X1-2027");
  const [sopDate, setSopDate] = useState("2027-03-15");
  const [shipTo, setShipTo] = useState("Assembly Plant, Normal, IL");
  const [annualVolume, setAnnualVolume] = useState(specs.estimatedAnnualVolume || 50000);

  const [qualityReqs, setQualityReqs] = useState(() => {
    const reqs = [...DEFAULT_QUALITY_REQS];
    if (specs.glossRequirement) reqs.splice(1, 0, `Surface finish: ${specs.glossRequirement} gloss, ${specs.surfaceClass || "Class A"}`);
    if (specs.colorRequirement) reqs.splice(2, 0, `Color match: ΔE < 0.5 vs master plaque (${specs.colorRequirement})`);
    return reqs;
  });

  const [deliveryReqs, setDeliveryReqs] = useState(() => {
    const reqs = [`Ship-to: ${shipTo}`, ...DEFAULT_DELIVERY_REQS];
    return reqs;
  });

  const [requiredDocs, setRequiredDocs] = useState(DEFAULT_DOCS);
  const [newReq, setNewReq] = useState({ quality: "", delivery: "", docs: "" });

  const addReq = (type) => {
    const val = newReq[type].trim();
    if (!val) return;
    if (type === "quality") setQualityReqs(prev => [...prev, val]);
    else if (type === "delivery") setDeliveryReqs(prev => [...prev, val]);
    else setRequiredDocs(prev => [...prev, val]);
    setNewReq(prev => ({ ...prev, [type]: "" }));
  };

  const removeReq = (type, idx) => {
    if (type === "quality") setQualityReqs(prev => prev.filter((_, i) => i !== idx));
    else if (type === "delivery") setDeliveryReqs(prev => prev.filter((_, i) => i !== idx));
    else setRequiredDocs(prev => prev.filter((_, i) => i !== idx));
  };

  const rfqPackage = {
    projectName, programCode, sopDate, shipTo, annualVolume,
    partSpecs: specs, qualityReqs, deliveryReqs, requiredDocs, images
  };

  return (
    <div className="p-6 max-w-5xl">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"><ArrowLeft size={16} />Back to Part Analysis</button>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">RFQ Package Builder</h2>
      <p className="text-gray-500 text-sm mb-6">Review and customize the RFQ package before sending to suppliers</p>

      {/* Document Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-lg">REQUEST FOR QUOTATION</h3>
              <p className="text-gray-400 text-sm">{programCode} · {new Date().toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-xs">SOP Target</div>
              <div className="text-white font-semibold">{sopDate}</div>
            </div>
          </div>
        </div>

        {/* Section 1: Project Info */}
        <div className="p-6 border-b border-gray-100">
          <SectionHeader number="1" title="Project Information" />
          <div className="grid grid-cols-2 gap-4 mt-4">
            <EditableField label="Project Name" value={projectName} onChange={setProjectName} />
            <EditableField label="Program Code" value={programCode} onChange={setProgramCode} />
            <EditableField label="SOP Date" value={sopDate} onChange={setSopDate} type="date" />
            <EditableField label="Annual Volume" value={annualVolume} onChange={v => setAnnualVolume(Number(v))} type="number" />
            <EditableField label="Ship-to Location" value={shipTo} onChange={setShipTo} className="col-span-2" />
          </div>
        </div>

        {/* Section 2: Part Specifications */}
        <div className="p-6 border-b border-gray-100">
          <SectionHeader number="2" title="Part Specifications" />

          {/* Images */}
          {images.length > 0 && (
            <div className="flex gap-3 mt-4 mb-4">
              {images.map((img, i) => (
                <img key={i} src={img.preview} alt={`Part view ${i + 1}`} className="w-32 h-32 object-cover rounded-lg border border-gray-200" />
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mt-4">
            <ReadOnlyField label="Part Name" value={specs.partName} />
            <ReadOnlyField label="Part Type" value={specs.partType} />
            <ReadOnlyField label="Manufacturing Process" value={specs.process} />
            <ReadOnlyField label="Primary Material" value={specs.material} />
            <ReadOnlyField label="Surface Finish" value={specs.finish} />
            <ReadOnlyField label="Surface Class" value={specs.surfaceClass} />
            <ReadOnlyField label="Color" value={specs.colorRequirement} />
            <ReadOnlyField label="Gloss Requirement" value={specs.glossRequirement} />
            <ReadOnlyField label="Attachment Method" value={specs.attachmentMethod} />
            <ReadOnlyField label="NVH" value={specs.nvhRequirement} />
          </div>

          {specs.estimatedDimensions && (
            <div className="mt-4 bg-gray-50 rounded-lg p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Dimensions</h4>
              <div className="flex gap-6 text-sm">
                <span><strong>L:</strong> {specs.estimatedDimensions.length_mm} mm</span>
                <span><strong>W:</strong> {specs.estimatedDimensions.width_mm} mm</span>
                <span><strong>H:</strong> {specs.estimatedDimensions.height_mm} mm</span>
                {specs.estimatedVolume_cm3 && <span><strong>Vol:</strong> ~{specs.estimatedVolume_cm3} cm³</span>}
              </div>
            </div>
          )}

          {specs.tolerances && (
            <div className="mt-3 bg-gray-50 rounded-lg p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tolerances</h4>
              <div className="flex gap-6 text-sm">
                <span><strong>General:</strong> {specs.tolerances.general}</span>
                <span><strong>Critical:</strong> {specs.tolerances.critical}</span>
              </div>
            </div>
          )}

          {specs.criticalFeatures && specs.criticalFeatures.length > 0 && (
            <div className="mt-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Critical Features</h4>
              <div className="flex flex-wrap gap-1.5">
                {specs.criticalFeatures.map((f, i) => (
                  <span key={i} className="bg-orange-50 text-orange-700 text-xs px-2 py-1 rounded-full border border-orange-200">{f}</span>
                ))}
              </div>
            </div>
          )}

          {specs.materialAlternates && specs.materialAlternates.length > 0 && (
            <div className="mt-3 bg-blue-50 rounded-lg p-4">
              <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Alternate Concepts Accepted</h4>
              <p className="text-sm text-blue-700">Materials: {specs.materialAlternates.join(", ")}</p>
              {specs.finishAlternates && <p className="text-sm text-blue-700">Finishes: {specs.finishAlternates.join(", ")}</p>}
              {specs.attachmentAlternate && <p className="text-sm text-blue-700">Attachment: {specs.attachmentAlternate}</p>}
            </div>
          )}
        </div>

        {/* Section 3: Quality Requirements */}
        <div className="p-6 border-b border-gray-100">
          <SectionHeader number="3" title="Quality Requirements" icon={Shield} />
          <ReqList items={qualityReqs} onRemove={(i) => removeReq("quality", i)} icon={CheckCircle} iconColor="text-green-500" />
          <AddReqInput value={newReq.quality} onChange={v => setNewReq(p => ({ ...p, quality: v }))} onAdd={() => addReq("quality")} placeholder="Add quality requirement..." />
        </div>

        {/* Section 4: Delivery Requirements */}
        <div className="p-6 border-b border-gray-100">
          <SectionHeader number="4" title="Delivery Requirements" icon={Truck} />
          <ReqList items={deliveryReqs} onRemove={(i) => removeReq("delivery", i)} icon={Truck} iconColor="text-blue-500" />
          <AddReqInput value={newReq.delivery} onChange={v => setNewReq(p => ({ ...p, delivery: v }))} onAdd={() => addReq("delivery")} placeholder="Add delivery requirement..." />
        </div>

        {/* Section 5: Required Documentation */}
        <div className="p-6">
          <SectionHeader number="5" title="Required Documentation" icon={FileText} />
          <ReqList items={requiredDocs} onRemove={(i) => removeReq("docs", i)} icon={FileText} iconColor="text-purple-500" />
          <AddReqInput value={newReq.docs} onChange={v => setNewReq(p => ({ ...p, docs: v }))} onAdd={() => addReq("docs")} placeholder="Add required document..." />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => onProceedToQuotes(rfqPackage)}
          className="bg-green-600 text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-green-700 transition-colors shadow-lg shadow-green-200 flex items-center gap-2"
        >
          <Package size={18} />
          Proceed to Quote Collection
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function SectionHeader({ number, title, icon: Icon }) {
  return (
    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
      <span className="bg-gray-800 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">{number}</span>
      {title}
      {Icon && <Icon size={14} className="text-gray-400" />}
    </h3>
  );
}

function EditableField({ label, value, onChange, type = "text", className = "" }) {
  return (
    <div className={className}>
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

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <span className="text-xs text-gray-400 block">{label}</span>
      <span className="text-sm text-gray-800 font-medium">{value || "—"}</span>
    </div>
  );
}

function ReqList({ items, onRemove, icon: Icon, iconColor }) {
  return (
    <ul className="mt-3 space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 group text-sm text-gray-700">
          <Icon size={14} className={`${iconColor} mt-0.5 flex-shrink-0`} />
          <span className="flex-1">{item}</span>
          <button onClick={() => onRemove(i)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"><X size={14} /></button>
        </li>
      ))}
    </ul>
  );
}

function AddReqInput({ value, onChange, onAdd, placeholder }) {
  return (
    <div className="flex gap-2 mt-3">
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === "Enter" && onAdd()}
        placeholder={placeholder}
        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <button onClick={onAdd} className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"><Plus size={16} /></button>
    </div>
  );
}
