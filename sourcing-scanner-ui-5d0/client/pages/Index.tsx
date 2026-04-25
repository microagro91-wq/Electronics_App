import { useState } from "react";

type QuoteBreakdown = {
  finalTotalCost: number;
};

type MarketAnalysisResponse = {
  recommendation: "local" | "online";
  local: QuoteBreakdown;
  online: QuoteBreakdown;
  matValue: number;
  onlineSwitchThreshold: number;
};

export default function DailySourcingScanner() {
  const [formData, setFormData] = useState({
    tvSize: "",
    softwareType: "",
    panelQuality: "",
    localQuote: "",
    quantityNeeded: "",
    onlineQuote: "",
    onlineDeliveryDays: "",
    urgentRestock: false,
  });

  const [showResults, setShowResults] = useState(false);
  const [resultState, setResultState] = useState<"green" | "red" | null>(null);
  const [analysisResult, setAnalysisResult] =
    useState<MarketAnalysisResponse | null>(null);
  const [showLogic, setShowLogic] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const runAnalysis = async (openLogicPanel: boolean) => {
    const isFormValid =
      formData.tvSize &&
      formData.softwareType &&
      formData.panelQuality &&
      formData.localQuote &&
      formData.quantityNeeded &&
      formData.onlineQuote &&
      formData.onlineDeliveryDays;

    if (isFormValid) {
      try {
        const response = await fetch("/api/market-analysis", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            localQuote: Number(formData.localQuote),
            quantityNeeded: Number(formData.quantityNeeded),
            onlineQuote: Number(formData.onlineQuote),
            onlineDeliveryDays: Number(formData.onlineDeliveryDays),
            urgentRestock: formData.urgentRestock,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to run market analysis");
        }

        const data: MarketAnalysisResponse = await response.json();
        setAnalysisResult(data);
        setResultState(data.recommendation === "local" ? "green" : "red");
        setShowLogic(openLogicPanel);
        setShowResults(true);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleSubmit = () => {
    void runAnalysis(false);
  };

  const handleViewLogic = () => {
    void runAnalysis(true);
  };

  const handleReset = () => {
    setFormData({
      tvSize: "",
      softwareType: "",
      panelQuality: "",
      localQuote: "",
      quantityNeeded: "",
      onlineQuote: "",
      onlineDeliveryDays: "",
      urgentRestock: false,
    });
    setShowResults(false);
    setResultState(null);
    setAnalysisResult(null);
    setShowLogic(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-5xl sm:text-6xl font-black text-foreground mb-3">
            Daily Sourcing Scanner
          </h1>
          <p className="text-lg text-muted-foreground">
            Quick market analysis for electronics retail
          </p>
        </div>

        {showResults ? (
          <>
            {/* Results Card */}
            <div className="mb-12">
              {resultState === "green" ? (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-4 border-emerald-500 rounded-2xl overflow-hidden shadow-xl">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-6 sm:py-8">
                    <div className="text-4xl sm:text-5xl font-black text-white mb-2">
                      🟢 BUY LOCAL
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-emerald-50">
                      Proceed with local supplier.
                    </div>
                  </div>
                  <div className="px-6 py-8 sm:py-10">
                    <p className="text-lg text-emerald-900 font-semibold mb-2">
                      Analysis Complete
                    </p>
                    <p className="text-emerald-700">
                      Your local supplier quote offers the best value. Proceed
                      with confidence.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border-4 border-red-500 rounded-2xl overflow-hidden shadow-xl">
                  <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-6 sm:py-8">
                    <div className="text-4xl sm:text-5xl font-black text-white mb-2">
                      🔴 STOP
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-red-50">
                      Better price found online. Manager Alerted.
                    </div>
                  </div>
                  <div className="px-6 py-8 sm:py-10">
                    <p className="text-lg text-red-900 font-semibold mb-2">
                      Review Required
                    </p>
                    <p className="text-red-700">
                      A manager has been notified and will assist with the next
                      steps.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Summary Section */}
            <div className="bg-white rounded-xl border border-border p-6 sm:p-8 mb-12 shadow-lg">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Scan Summary
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">
                    TV Size
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {formData.tvSize}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">
                    Software Type
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {formData.softwareType}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">
                    Panel Quality
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {formData.panelQuality}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">
                    Local Quote
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    ₹{Number(formData.localQuote).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">
                    Quantity
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {formData.quantityNeeded}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">
                    Urgent Restock
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {formData.urgentRestock ? "Yes ⚡" : "No"}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            {analysisResult ? (
              <button
                onClick={() => setShowLogic((prev) => !prev)}
                className="button-massive bg-slate-700 hover:bg-slate-800 text-white font-bold shadow-lg hover:shadow-xl mb-6"
              >
                {showLogic ? "Hide Logic" : "View Logic"}
              </button>
            ) : null}

            {showLogic && analysisResult ? (
              <div className="bg-white rounded-xl border border-border p-6 sm:p-8 mb-8 shadow-lg">
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Final Decision Logic
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">
                      TCO Local
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      ₹
                      {Number(analysisResult.local.finalTotalCost).toLocaleString(
                        "en-IN"
                      )}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">
                      TCO Online
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      ₹
                      {Number(
                        analysisResult.online.finalTotalCost
                      ).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">
                      MAT (5%)
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      ₹{Number(analysisResult.matValue).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">
                      Online Switch Threshold
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      ₹
                      {Number(
                        analysisResult.onlineSwitchThreshold
                      ).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
                <div className="mt-6 p-4 rounded-lg bg-slate-100 border border-slate-200">
                  <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">
                    Final Gate
                  </p>
                  <p className="text-lg font-bold text-foreground mt-2">
                    IF TCO_Online &lt;= (TCO_Local - MAT) THEN STOP, ELSE BUY
                    LOCAL
                  </p>
                </div>
              </div>
            ) : null}

            <button
              onClick={handleReset}
              className="button-massive bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg hover:shadow-xl mb-6"
            >
              New Scan
            </button>
          </>
        ) : (
          <>
            {/* Form Section */}
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-10 mb-8">
              <div className="space-y-6">
                {/* TV Size Dropdown */}
                <div>
                  <label className="block text-lg font-bold text-foreground mb-3">
                    TV Size
                  </label>
                  <select
                    name="tvSize"
                    value={formData.tvSize}
                    onChange={handleInputChange}
                    className="select-large w-full"
                  >
                    <option value="">Select TV Size</option>
                    <option value="24&quot;">24&quot;</option>
                    <option value="32&quot;">32&quot;</option>
                    <option value="43&quot;">43&quot;</option>
                    <option value="50&quot;">50&quot;</option>
                    <option value="55&quot;">55&quot;</option>
                    <option value="65&quot;">65&quot;</option>
                  </select>
                </div>

                {/* Software Type Dropdown */}
                <div>
                  <label className="block text-lg font-bold text-foreground mb-3">
                    Software Type
                  </label>
                  <select
                    name="softwareType"
                    value={formData.softwareType}
                    onChange={handleInputChange}
                    className="select-large w-full"
                  >
                    <option value="">Select Software Type</option>
                    <option value="Non-Smart">Non-Smart</option>
                    <option value="Android 11">Android 11</option>
                    <option value="WebOS">WebOS</option>
                  </select>
                </div>

                {/* Panel Quality Dropdown */}
                <div>
                  <label className="block text-lg font-bold text-foreground mb-3">
                    Panel Quality
                  </label>
                  <select
                    name="panelQuality"
                    value={formData.panelQuality}
                    onChange={handleInputChange}
                    className="select-large w-full"
                  >
                    <option value="">Select Panel Quality</option>
                    <option value="Standard">Standard</option>
                    <option value="Frameless">Frameless</option>
                    <option value="A+ Grade">A+ Grade</option>
                  </select>
                </div>

                {/* Local Supplier Quote Input */}
                <div>
                  <label className="block text-lg font-bold text-foreground mb-3">
                    Local Supplier Quote (₹)
                  </label>
                  <input
                    type="number"
                    name="localQuote"
                    value={formData.localQuote}
                    onChange={handleInputChange}
                    placeholder="Enter amount"
                    className="input-large w-full"
                    inputMode="numeric"
                  />
                </div>

                {/* Quantity Needed Input */}
                <div>
                  <label className="block text-lg font-bold text-foreground mb-3">
                    Quantity Needed Today
                  </label>
                  <input
                    type="number"
                    name="quantityNeeded"
                    value={formData.quantityNeeded}
                    onChange={handleInputChange}
                    placeholder="Enter quantity"
                    className="input-large w-full"
                    inputMode="numeric"
                  />
                </div>

                {/* Online B2B Market Deal Section */}
                <div className="bg-slate-50 border border-border rounded-xl p-5 sm:p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4">
                    Online B2B Market Deal
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-lg font-bold text-foreground mb-3">
                        Online Platform Quote (₹)
                      </label>
                      <input
                        type="number"
                        name="onlineQuote"
                        value={formData.onlineQuote}
                        onChange={handleInputChange}
                        placeholder="Enter amount"
                        className="input-large w-full"
                        inputMode="numeric"
                      />
                    </div>
                    <div>
                      <label className="block text-lg font-bold text-foreground mb-3">
                        Online Delivery Time (Days)
                      </label>
                      <input
                        type="number"
                        name="onlineDeliveryDays"
                        value={formData.onlineDeliveryDays}
                        onChange={handleInputChange}
                        placeholder="Enter days"
                        className="input-large w-full"
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                </div>

                {/* Urgent Restock Toggle */}
                <div>
                  <label className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg cursor-pointer hover:bg-amber-50 transition-colors">
                    <input
                      type="checkbox"
                      name="urgentRestock"
                      checked={formData.urgentRestock}
                      onChange={handleInputChange}
                      className="w-8 h-8 rounded border-2 border-amber-400 cursor-pointer"
                    />
                    <span className="text-lg font-bold text-foreground">
                      Urgent Restock (Needed in &lt; 24 Hours)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={
                !formData.tvSize ||
                !formData.softwareType ||
                !formData.panelQuality ||
                !formData.localQuote ||
                !formData.quantityNeeded ||
                !formData.onlineQuote ||
                !formData.onlineDeliveryDays
              }
              className="button-massive bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-primary-foreground shadow-lg hover:shadow-xl"
            >
              Run Market Analysis
            </button>
            <button
              onClick={handleViewLogic}
              disabled={
                !formData.tvSize ||
                !formData.softwareType ||
                !formData.panelQuality ||
                !formData.localQuote ||
                !formData.quantityNeeded ||
                !formData.onlineQuote ||
                !formData.onlineDeliveryDays
              }
              className="button-massive mt-4 bg-slate-700 hover:bg-slate-800 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-white shadow-lg hover:shadow-xl"
            >
              View Logic
            </button>
          </>
        )}
      </div>
    </div>
  );
}
