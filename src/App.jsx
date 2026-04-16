import { useState } from "react";
import { Upload, FileText, LayoutDashboard, Zap, Brain, BarChart3, ChevronRight, CheckCircle, Package } from "lucide-react";
import ErrorBoundary from "./components/ErrorBoundary";
import PartUpload from "./pages/PartUpload";
import RFQBuilder from "./pages/RFQBuilder";
import QuoteCollection from "./pages/QuoteCollection";
import QuoteComparison from "./pages/QuoteComparison";

// ── Flow Steps ─────────────────────────────────────────────────────────────────
const STEPS = [
  { key: "upload", label: "Part Analysis", icon: Upload, desc: "Upload images & identify specs" },
  { key: "rfq", label: "RFQ Package", icon: FileText, desc: "Build request for quotation" },
  { key: "quotes", label: "Collect Quotes", icon: Package, desc: "Upload or generate quotes" },
  { key: "compare", label: "Compare & Decide", icon: BarChart3, desc: "AI-scored comparison" },
];

export default function App() {
  const [currentStep, setCurrentStep] = useState("upload");
  const [partData, setPartData] = useState(null);
  const [rfqPackage, setRfqPackage] = useState(null);
  const [collectedQuotes, setCollectedQuotes] = useState(null);

  const stepIndex = STEPS.findIndex(s => s.key === currentStep);

  const handlePartAnalyzed = (data) => {
    setPartData(data);
    setCurrentStep("rfq");
  };

  const handleRFQReady = (pkg) => {
    setRfqPackage(pkg);
    setCurrentStep("quotes");
  };

  const handleQuotesReady = (quotes) => {
    setCollectedQuotes(quotes);
    setCurrentStep("compare");
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <nav className="bg-gray-900 text-white w-56 h-screen flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-gray-700">
          <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Zap size={20} className="text-blue-400" />
            SupplyFlow
            <span className="text-blue-400 text-xs font-normal ml-1">AI</span>
          </h1>
          <p className="text-gray-400 text-xs mt-1">Supplier Intelligence Platform</p>
        </div>

        {/* Flow Steps */}
        <div className="flex-1 py-4">
          {STEPS.map((step, i) => {
            const isActive = step.key === currentStep;
            const isComplete = i < stepIndex;
            const isLocked = i > stepIndex;
            const Icon = step.icon;

            return (
              <button
                key={step.key}
                onClick={() => !isLocked && setCurrentStep(step.key)}
                disabled={isLocked}
                className={`w-full flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                  isActive
                    ? "bg-gray-800 text-white border-r-2 border-blue-400"
                    : isComplete
                    ? "text-green-400 hover:bg-gray-800/50 cursor-pointer"
                    : "text-gray-500 cursor-not-allowed"
                }`}
              >
                <div className="relative">
                  {isComplete ? (
                    <CheckCircle size={18} className="text-green-400" />
                  ) : (
                    <Icon size={18} className={isActive ? "text-blue-400" : ""} />
                  )}
                </div>
                <div className="text-left">
                  <div className={`${isActive ? "font-medium" : ""}`}>{step.label}</div>
                  <div className="text-xs text-gray-500">{step.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Progress Indicator */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex gap-1.5 mb-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1.5 rounded-full ${
                  i < stepIndex ? "bg-green-500" : i === stepIndex ? "bg-blue-500" : "bg-gray-700"
                }`}
              />
            ))}
          </div>
          <div className="text-xs text-gray-500">Step {stepIndex + 1} of {STEPS.length}</div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <ErrorBoundary>
          {currentStep === "upload" && (
            <PartUpload onPartAnalyzed={handlePartAnalyzed} />
          )}
          {currentStep === "rfq" && (
            <RFQBuilder
              partData={partData}
              onProceedToQuotes={handleRFQReady}
              onBack={() => setCurrentStep("upload")}
            />
          )}
          {currentStep === "quotes" && (
            <QuoteCollection
              rfqPackage={rfqPackage}
              onProceedToComparison={handleQuotesReady}
              onBack={() => setCurrentStep("rfq")}
            />
          )}
          {currentStep === "compare" && (
            <QuoteComparison
              quotes={collectedQuotes}
              rfqPackage={rfqPackage}
              onBack={() => setCurrentStep("quotes")}
            />
          )}
        </ErrorBoundary>
      </main>
    </div>
  );
}
