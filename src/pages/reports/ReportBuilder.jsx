import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOrg } from "../../hooks/useOrg";
import { useAuth } from "../../hooks/useAuth";
import { generateReport } from "../../services/reportService";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import toast from "react-hot-toast";

const QUICK_RANGES = [
  { label: "Today", getValue: () => ({ from: format(new Date(), "yyyy-MM-dd"), to: format(new Date(), "yyyy-MM-dd") }) },
  { label: "Yesterday", getValue: () => ({ from: format(subDays(new Date(), 1), "yyyy-MM-dd"), to: format(subDays(new Date(), 1), "yyyy-MM-dd") }) },
  { label: "This Week", getValue: () => ({ from: format(startOfWeek(new Date()), "yyyy-MM-dd"), to: format(endOfWeek(new Date()), "yyyy-MM-dd") }) },
  { label: "This Month", getValue: () => ({ from: format(startOfMonth(new Date()), "yyyy-MM-dd"), to: format(endOfMonth(new Date()), "yyyy-MM-dd") }) },
  { label: "Last 7 Days", getValue: () => ({ from: format(subDays(new Date(), 6), "yyyy-MM-dd"), to: format(new Date(), "yyyy-MM-dd") }) },
  { label: "Last 30 Days", getValue: () => ({ from: format(subDays(new Date(), 29), "yyyy-MM-dd"), to: format(new Date(), "yyyy-MM-dd") }) },
];

export default function ReportBuilder() {

  const navigate = useNavigate();

  const { org } = useOrg();
  const { user } = useAuth();

  const orgId = org?.id;

  console.log("ORG:", org);
  console.log("ORG ID:", orgId);

  const [projects, setProjects] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [allProjects, setAllProjects] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: format(new Date(), "yyyy-MM-dd"),
    to: format(new Date(), "yyyy-MM-dd"),
  });
  const [features, setFeatures] = useState({
    inventory: true,
    finance: true,
    employees: true,
  });
  const [customFeaturesList, setCustomFeaturesList] = useState([]);
  const [selectedCustom, setSelectedCustom] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {

  console.log(
    "REPORT BUILDER RENDERED"
  );

  console.log(
    "ORG ID:",
    orgId
  );

  if (!orgId) return;

  console.log(
    "CALLING FETCH PROJECTS"
  );

  fetchProjects();
  fetchCustomFeatures();

}, [orgId]);

  const fetchProjects = async () => {
    try {
      const q = query(collection(db, "projects"), where("orgId", "==", orgId));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProjects(list);
    } catch (e) {
      toast.error("Failed to load projects");
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchCustomFeatures = async () => {
    try {
      // Collect all custom features across projects
      const q = query(collection(db, "projects"), where("orgId", "==", orgId));
      const snap = await getDocs(q);
      const allCustom = [];
      for (const doc of snap.docs) {
        const cfSnap = await getDocs(collection(db, `customFeatures/${orgId}_${doc.id}/features`));
        cfSnap.forEach((cf) => allCustom.push({ id: cf.id, projectId: doc.id, ...cf.data() }));
      }
      setCustomFeaturesList(allCustom);
    } catch (e) {
      // silently fail
    }
  };

  const toggleProject = (id) => {
    setSelectedProjects((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleAllProjects = () => {
    setAllProjects((v) => {
      if (!v) setSelectedProjects(projects.map((p) => p.id));
      else setSelectedProjects([]);
      return !v;
    });
  };

  const applyQuickRange = (rangeObj) => {
    setDateRange(rangeObj.getValue());
  };

  const handleGenerate = async () => {
    const projectIds = allProjects ? projects.map((p) => p.id) : selectedProjects;
    if (projectIds.length === 0) {
      toast.error("Please select at least one project");
      return;
    }
    if (!features.inventory && !features.finance && !features.employees && selectedCustom.length === 0) {
      toast.error("Please select at least one feature to include");
      return;
    }
    setLoading(true);
    try {
      const selectedProjects =
  projects.filter((p) =>
    projectIds.includes(p.id)
  );

console.log(
  "SELECTED PROJECTS:",
  selectedProjects
);

const reportData =
  await generateReport({
    orgId,
    projectIds,
    startDate: dateRange.from,
    endDate: dateRange.to,
    projects: selectedProjects,
  });

      navigate("/reports/preview", { state: { reportData, dateRange, features, selectedCustom } });
    } catch (e) {
      toast.error("Failed to generate report: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1 mb-4">
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Generate Report</h1>
          <p className="text-gray-500 mt-1">Select date range, projects, and features to include</p>
        </div>

        {/* Step 1: Date Range */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">1</span>
            Select Date Range
          </h2>

          {/* Quick ranges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {QUICK_RANGES.map((r) => (
  <button
    key={r.label}
    onClick={() => applyQuickRange(r)}
    className="
      px-3 py-1.5
      text-sm
      font-medium
      text-gray-900
      rounded-lg
      border border-gray-300
      bg-white
      hover:bg-blue-50
      hover:border-blue-300
      hover:text-blue-700
      transition-colors
    "
  >
    {r.label}
  </button>
))}
          </div>

          {/* Custom date inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">From</label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange((d) => ({ ...d, from: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">To</label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange((d) => ({ ...d, to: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Projects */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">2</span>
            Select Projects
          </h2>

          {loadingProjects ? (
            <p className="text-gray-400 text-sm">Loading projects…</p>
          ) : (
            <>
              <label className="flex items-center gap-3 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allProjects}
                  onChange={toggleAllProjects}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="font-medium text-gray-700">All Projects (Combined Report)</span>
              </label>
              <div className="space-y-2 pl-2">
                {projects.map((p) => (
                  <label key={p.id} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedProjects.includes(p.id)}
                      onChange={() => toggleProject(p.id)}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span className="text-gray-700">{p.name}</span>
                  </label>
                ))}
                {projects.length === 0 && (
                  <p className="text-gray-400 text-sm">No projects found.</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Step 3: Features */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">3</span>
            Include Features
          </h2>

          <div className="space-y-3">
            {[
              { key: "inventory", label: "📦 Inventory Management", desc: "Stock entries, low stock alerts, material usage" },
              { key: "finance", label: "💰 Finance Management", desc: "Expenses, earnings, financial summary" },
              { key: "employees", label: "👷 Employee Management", desc: "Labour records, attendance, assignments" },
            ].map(({ key, label, desc }) => (
              <label key={key} className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={features[key]}
                  onChange={() => setFeatures((f) => ({ ...f, [key]: !f[key] }))}
                  className="w-4 h-4 mt-0.5 accent-blue-600"
                />
                <div>
                  <p className="font-medium text-gray-700">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
              </label>
            ))}

            {customFeaturesList.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-2 pl-1">Custom Features</p>
                {customFeaturesList.map((cf) => (
                  <label key={cf.id} className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedCustom.includes(cf.id)}
                      onChange={() =>
                        setSelectedCustom((prev) =>
                          prev.includes(cf.id) ? prev.filter((x) => x !== cf.id) : [...prev, cf.id]
                        )
                      }
                      className="w-4 h-4 mt-0.5 accent-blue-600"
                    />
                    <div>
                      <p className="font-medium text-gray-700">⚙️ {cf.name}</p>
                      <p className="text-xs text-gray-400">Custom feature</p>
                    </div>
                  </label>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-2xl text-lg transition-colors shadow-lg shadow-blue-200"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Generating Report…
            </span>
          ) : (
            "Generate Report →"
          )}
        </button>
      </div>
    </div>
  );
}

const fetchProjects = async () => {
  try {

    console.log("ORG ID:", orgId);

    const q = query(
      collection(db, "projects"),
      where("orgId", "==", orgId)
    );

    const snap = await getDocs(q);

    console.log(
      "PROJECT DOC COUNT:",
      snap.size
    );

    const list = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    console.log(
      "PROJECT LIST:",
      list
    );

    setProjects(list);

  } catch (e) {

    console.error(e);

    toast.error(
      "Failed to load projects"
    );

  } finally {
    setLoadingProjects(false);
  }
};