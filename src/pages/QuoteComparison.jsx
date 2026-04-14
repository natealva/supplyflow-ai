import { useState, useMemo, Fragment } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { Brain, Trophy, ArrowLeft, AlertTriangle, CheckCircle, TrendingUp, DollarSign, Clock, Shield, ChevronDown, ChevronUp } from "lucide-react";

export default function QuoteComparison({ quotes, rfqPackage, onBack }) {
  const [expandedQuote, setExpandedQuote] = useState(null);

  const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
  const fmtK = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  // Score quotes
  const scored = useMemo(() => {
    if (!quotes || quotes.length === 0) return [];

    const minPrice = Math.min(...quotes.map(q => q.unitPrice || 999));
    const maxPrice = Math.max(...quotes.map(q => q.unitPrice || 0));
    const minTooling = Math.min(...quotes.map(q => q.toolingCost || 999999));
    const maxTooling = Math.max(...quotes.map(q => q.toolingCost || 0));
    const minLead = Math.min(...quotes.map(q => q.leadTime_weeks || 99));
    const maxLead = Math.max(...quotes.map(q => q.leadTime_weeks || 0));
    const maxCap = Math.max(...quotes.map(q => q.capacityPerWeek || 0));

    return quotes.map(q => {
      const priceRange = maxPrice - minPrice || 1;
      const toolRange = maxTooling - minTooling || 1;
      const leadRange = maxLead - minLead || 1;

      const priceScore = (1 - ((q.unitPrice || 0) - minPrice) / priceRange) * 100;
      const toolingScore = (1 - ((q.toolingCost || 0) - minTooling) / toolRange) * 100;
      const leadScore = (1 - ((q.leadTime_weeks || 0) - minLead) / leadRange) * 100;
      const capScore = maxCap > 0 ? ((q.capacityPerWeek || 0) / maxCap) * 100 : 50;
      const riskScore = q.risks && q.risks.length > 0 ? Math.max(0, 100 - q.risks.length * 25) : 100;

      const composite = (
        priceScore * 0.30 +
        toolingScore * 0.10 +
        leadScore * 0.20 +
        capScore * 0.15 +
        riskScore * 0.25
      );

      const annualVolume = rfqPackage?.annualVolume || 50000;
      const totalAnnualCost = (q.unitPrice || 0) * annualVolume + (q.toolingCost || 0);

      return {
        ...q,
        scores: { price: Math.round(priceScore), tooling: Math.round(toolingScore), leadTime: Math.round(leadScore), capacity: Math.round(capScore), risk: Math.round(riskScore) },
        compositeScore: Math.round(composite * 10) / 10,
        totalAnnualCost
      };
    }).sort((a, b) => b.compositeScore - a.compositeScore);
  }, [quotes, rfqPackage]);

  const winner = scored[0];
  const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  const priceData = scored.map(q => ({
    name: q.supplierName?.split(" ")[0] || "Unknown",
    unitPrice: q.unitPrice,
    tooling: (q.toolingCost || 0) / 1000
  }));

  const radarData = [
    { metric: "Price", ...Object.fromEntries(scored.map(q => [q.supplierName?.split(" ")[0], q.scores.price])) },
    { metric: "Lead Time", ...Object.fromEntries(scored.map(q => [q.supplierName?.split(" ")[0], q.scores.leadTime])) },
    { metric: "Capacity", ...Object.fromEntries(scored.map(q => [q.supplierName?.split(" ")[0], q.scores.capacity])) },
    { metric: "Risk", ...Object.fromEntries(scored.map(q => [q.supplierName?.split(" ")[0], q.scores.risk])) },
    { metric: "Tooling", ...Object.fromEntries(scored.map(q => [q.supplierName?.split(" ")[0], q.scores.tooling])) },
  ];

  return (
    <div className="p-6 max-w-6xl">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"><ArrowLeft size={16} />Back to Quote Collection</button>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">AI Quote Comparison</h2>
      <p className="text-gray-500 text-sm mb-6">{scored.length} supplier quotes analyzed and ranked</p>

      {/* AI Recommendation */}
      {winner && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white mb-6 shadow-lg">
          <div className="flex items-center gap-2 mb-3"><Brain size={20} /><span className="font-semibold text-lg">AI Recommendation</span></div>
          <p className="text-blue-100 text-sm mb-4">
            Quotes scored on: unit price (30%), lead time (20%), risk factors (25%), capacity (15%), and tooling cost (10%).
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Trophy size={20} className="text-yellow-300" />
                <span className="text-2xl font-bold">{winner.supplierName}</span>
              </div>
              <div className="text-blue-200 text-sm">
                {winner.concept || winner.processQuoted} · {fmt(winner.unitPrice)}/unit · {winner.leadTime_weeks} week lead time · {fmtK(winner.toolingCost)} tooling
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{winner.compositeScore}</div>
              <div className="text-blue-200 text-xs">Composite Score</div>
            </div>
          </div>
          {winner.notes && (
            <p className="text-blue-100 text-xs mt-3 italic">"{winner.notes}"</p>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Unit Price Comparison</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={priceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={v => fmt(v)} />
              <Bar dataKey="unitPrice" name="Unit Price" radius={[6, 6, 0, 0]}>
                {priceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Multi-Dimensional Comparison</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
              {scored.map((q, i) => (
                <Radar key={i} name={q.supplierName?.split(" ")[0]} dataKey={q.supplierName?.split(" ")[0]}
                  stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.1} strokeWidth={2} />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ranking Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="p-5 border-b border-gray-100"><h3 className="font-semibold text-gray-800">Ranked Supplier Quotes</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                <th className="px-5 py-3">Rank</th>
                <th className="px-5 py-3">Supplier</th>
                <th className="px-5 py-3">Unit Price</th>
                <th className="px-5 py-3">Tooling</th>
                <th className="px-5 py-3">Lead Time</th>
                <th className="px-5 py-3">PPAP</th>
                <th className="px-5 py-3">Cap/Wk</th>
                <th className="px-5 py-3">Total Annual</th>
                <th className="px-5 py-3">Risks</th>
                <th className="px-5 py-3">Score</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {scored.map((q, i) => (
                <Fragment key={i}>
                  <tr className={`border-b border-gray-50 cursor-pointer transition-colors ${i === 0 ? "bg-green-50" : "hover:bg-gray-50"}`}
                    onClick={() => setExpandedQuote(expandedQuote === i ? null : i)}>
                    <td className="px-5 py-4">
                      {i === 0
                        ? <span className="bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit"><Trophy size={10} />1</span>
                        : <span className="text-gray-400 font-medium">{i + 1}</span>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900">{q.supplierName}</div>
                      <div className="text-xs text-gray-400">{q.supplierLocation}</div>
                    </td>
                    <td className="px-5 py-4 font-semibold">{fmt(q.unitPrice)}</td>
                    <td className="px-5 py-4">{fmtK(q.toolingCost)}</td>
                    <td className="px-5 py-4">{q.leadTime_weeks} wks</td>
                    <td className="px-5 py-4">{q.ppapTimeline_weeks} wks</td>
                    <td className="px-5 py-4">{q.capacityPerWeek?.toLocaleString()}</td>
                    <td className="px-5 py-4 font-medium">{fmtK(q.totalAnnualCost)}</td>
                    <td className="px-5 py-4">
                      {q.risks && q.risks.length > 0
                        ? <span className="text-orange-500 flex items-center gap-1"><AlertTriangle size={14} />{q.risks.length}</span>
                        : <span className="text-green-500"><CheckCircle size={14} /></span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`font-bold text-sm ${i === 0 ? "text-green-600" : "text-gray-700"}`}>{q.compositeScore}</span>
                    </td>
                    <td className="px-5 py-4 text-gray-400">
                      {expandedQuote === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </td>
                  </tr>
                  {expandedQuote === i && (
                    <tr className="bg-gray-50">
                      <td colSpan={11} className="px-8 py-4">
                        <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                          <div><span className="text-gray-400 text-xs block">Material</span><span className="font-medium">{q.materialQuoted || "—"}</span></div>
                          <div><span className="text-gray-400 text-xs block">Process</span><span className="font-medium">{q.processQuoted || "—"}</span></div>
                          <div><span className="text-gray-400 text-xs block">Freight</span><span className="font-medium">{q.freightTerms || "—"}</span></div>
                          <div><span className="text-gray-400 text-xs block">Payment</span><span className="font-medium">{q.paymentTerms || "—"}</span></div>
                        </div>
                        {q.notes && <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200 mb-2">{q.notes}</p>}
                        {q.risks && q.risks.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {q.risks.map((r, ri) => (
                              <span key={ri} className="bg-red-50 text-red-600 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                <AlertTriangle size={10} />{r}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="mt-3 grid grid-cols-5 gap-2">
                          {Object.entries(q.scores).map(([key, val]) => (
                            <div key={key} className="text-center bg-white rounded-lg border border-gray-200 p-2">
                              <div className={`text-lg font-bold ${val >= 70 ? "text-green-600" : val >= 40 ? "text-yellow-600" : "text-red-600"}`}>{val}</div>
                              <div className="text-xs text-gray-400 capitalize">{key}</div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
