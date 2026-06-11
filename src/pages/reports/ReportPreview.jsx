import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useRef } from "react";
import { format } from "date-fns";

export default function ReportPreview() {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const printRef = useRef();

  const { reportData, dateRange, features, selectedCustom } = location.state || {};

  if (!reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No report data found.</p>
          <button onClick={() => navigate(-1)} className="text-blue-600 underline">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const {
  projects,
  generatedAt
} = reportData;

console.log("ORG ID IN PREVIEW:", orgId);

  const handleDownloadPDF = () => {
  navigate("/reports/export", {
    state: {
      reportData,
      dateRange,
    },
  });
};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1">
          ← Edit Report
        </button>
        <h1 className="font-bold text-gray-800 text-base">Report Preview</h1>
        <button
          onClick={handleDownloadPDF}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          Download PDF
        </button>
      </div>

      <div ref={printRef} className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {/* Report Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">EasyTrack Report</h2>
              <p className="text-gray-500 mt-1">
                Period: <span className="font-medium text-gray-700">{dateRange?.from}</span> to{" "}
                <span className="font-medium text-gray-700">{dateRange?.to}</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">Generated: {format(new Date(generatedAt || Date.now()), "dd MMM yyyy, hh:mm a")}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Projects Included</p>
              {projects?.map((p) => (
                <p key={p.id} className="font-semibold text-gray-700 text-sm">{p.name}</p>
              ))}
            </div>
          </div>
        </div>

        {/* INVENTORY REPORT */}

{projects?.map((project) => (
  <div
    key={project.projectId}
    className="bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden"
  >
    <div className="bg-blue-600 px-6 py-4">
      <h3 className="text-lg font-bold text-white">
        INVENTORY REPORT
      </h3>
    </div>

    <div className="bg-gray-100 px-6 py-3 border-b">

  <div className="bg-gray-100 px-6 py-4 border-b">

  <p className="text-2xl font-bold text-black">
    Project:
  </p>

  <p className="text-2xl font-bold text-black">
    {project.projectName}
  </p>


</div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

  <div className="bg-white rounded-xl p-4 border">

    <p className="text-sm text-gray-500">
      Total Items
    </p>

    <p className="text-2xl font-bold text-black">
      {Object.keys(
        project.inventorySummary || {}
      ).length}
    </p>

  </div>

  <div className="bg-white rounded-xl p-4 border">

    <p className="text-sm text-gray-500">
      Transactions Done
    </p>

    <p className="text-2xl font-bold text-black">
      {project.inventoryEntries?.length || 0}
    </p>

  </div>

</div>


</div>

<div className="overflow-x-auto border rounded-xl m-6">

  <table className="w-full">

    <thead>
      <tr className="bg-gray-100">

        <th className="p-3 text-left font-bold">
          ITEM
        </th>

        {Array.from(
          new Set(
            Object.values(
              project.inventorySummary || {}
            ).flatMap((item) =>
              Object.keys(item).filter(
                (key) =>
                  !key.endsWith("_unit")
              )
            )
          )
        ).map((column) => (

          <th
            key={column}
            className="p-3 text-left font-bold"
          >
            {column
              .replaceAll("_", " ")
              .toUpperCase()}
          </th>

        ))}

      </tr>
    </thead>

    <tbody>

      {Object.entries(
        project.inventorySummary || {}
      ).map(([itemName, data]) => (

        <tr
          key={itemName}
          className="border-t"
        >

          <td className="p-3 font-semibold text-black">
            {itemName}
          </td>

          {Array.from(
            new Set(
              Object.values(
                project.inventorySummary || {}
              ).flatMap((item) =>
                Object.keys(item).filter(
                  (key) =>
                    !key.endsWith("_unit")
                )
              )
            )
          ).map((column) => (

            <td
              key={column}
              className="p-3 text-black"
            >
              {data[column] ?? "-"}
              {" "}
              {data[`${column}_unit`] || ""}
            </td>

          ))}

        </tr>

      ))}

    </tbody>

  </table>

</div>

{/* Detailed Cards */}

<div className="space-y-4 mt-6">

  {Object.entries(
    project.inventorySummary || {}
  ).map(([itemName, data]) => (

    <div
      key={`card-${itemName}`}
      className="border rounded-xl p-4 bg-white"
    >

      <h4 className="text-xl font-bold text-black mb-2">
        {itemName}
      </h4>

      <p className="text-sm text-gray-500 mb-4">
        {dateRange?.from} TO {dateRange?.to}
      </p>

      {Object.entries(data).map(
        ([key, value]) => {

          if (key.endsWith("_unit")) {
            return null;
          }

          return (
            <div
              key={key}
              className="mb-2 text-black"
            >
              <span className="font-semibold">
                TOTAL{" "}
                {key
                  .replaceAll("_", " ")
                  .toUpperCase()}
              </span>

              {" = "}

              {value}

              {" "}

              {data[`${key}_unit`] || ""}
            </div>
          );
        }
      )}

    </div>

  ))}

</div>

<div className="p-6 space-y-6">

  {console.log(
    "INVENTORY SUMMARY",
    project.inventorySummary
  )}

  

    </div>
  </div>
))}


{/* FINANCE REPORT */}

{projects?.map((project) => (

  <div
    key={`finance-${project.projectId}`}
    className="bg-white rounded-2xl border border-green-200 shadow-sm overflow-hidden mt-8"
  >

    <div className="bg-green-600 px-6 py-4">

      <h3 className="text-lg font-bold text-white">
        FINANCE REPORT
      </h3>

    </div>

    <div className="p-6">

      <h2 className="text-2xl font-bold text-black mb-4">
        {project.projectName}
      </h2>

      <div className="grid grid-cols-3 gap-4 mb-6">

        <div className="border rounded-xl p-4">

          <p className="text-gray-500">
            Total Income
          </p>

          <p className="text-2xl font-bold text-green-600">
            ₹
            {Number(
              project.financeSummary
                ?.totalIncome || 0
            ).toLocaleString()}
          </p>

        </div>

        <div className="border rounded-xl p-4">

          <p className="text-gray-500">
            Total Expense
          </p>

          <p className="text-2xl font-bold text-red-600">
            ₹
            {Number(
              project.financeSummary
                ?.totalExpense || 0
            ).toLocaleString()}
          </p>

        </div>

        <div className="border rounded-xl p-4">

          <p className="text-gray-500">
            Balance
          </p>

          <p className="text-2xl font-bold text-blue-600">
            ₹
            {Number(
              project.financeSummary
                ?.balance || 0
            ).toLocaleString()}
          </p>

        </div>

      </div>

      <table className="w-full border">

        <thead>

          <tr className="bg-gray-100">

            <th className="p-3">
              Date
            </th>

            <th className="p-3">
              Name
            </th>

            <th className="p-3">
              Type
            </th>

            <th className="p-3">
              Amount
            </th>

          </tr>

        </thead>

        <tbody>

          {project.financeEntries
            ?.map((f) => (

              <tr
                key={f.id}
                className="border-t"
              >

                <td className="p-3">
                  {f.date}
                </td>

                <td className="p-3">
                  {f.name}
                </td>

                <td className="p-3">
                  {f.type}
                </td>

                <td className="p-3">
                  ₹
                  {Number(
                    f.amount || 0
                  ).toLocaleString()}
                </td>

              </tr>

          ))}

        </tbody>

</table>

<div className="mt-8">

  <h3 className="text-xl font-bold text-black mb-4">
  Transcation Gains & Losses
</h3>

  <div className="grid grid-cols-3 gap-4">

    {Object.entries(
      project.partySummary || {}
    )
      .sort(
        (a, b) =>
          b[1].amount -
          a[1].amount
      )
      .slice(0, 10)
      .map(([name, data]) => (

        <div
  key={name}
  className="border rounded-xl p-4 bg-white"
>

          <h4 className="font-bold text-black text-lg">
  {name}
</h4>

<p className="text-gray-700 mt-2">
  Transactions: {data.count}
</p>

<p className="text-gray-700">
  Income:
₹{Number(
  data.income || 0
).toLocaleString()}
</p>

<p className="text-gray-700">
  Expense:
₹{Number(
  data.expense || 0
).toLocaleString()}
</p>

{data.net >= 0 ? (

  <p className="font-bold text-green-600 mt-2">

    NET PROFIT:
    ₹{Number(
  data.net || 0
).toLocaleString()}

  </p>

) : (

  <p className="font-bold text-red-600 mt-2">

    NET LOSS:
    -₹{Math.abs(
  Number(data.net || 0)
).toLocaleString()}

  </p>

)}

        </div>

      ))}

  </div>

</div>

</div>

</div>


))}


{/* Footer */}
<div className="text-center text-xs text-gray-400 pb-6">
  Generated by EasyTrack · {format(new Date(), "dd MMM yyyy")}
</div>
      </div>
    </div>
  );
}

/* ─── ReportSection Component ─── */
function ReportSection({ title, color, summary, tables }) {
  const colorMap = {
    blue: { bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-700", header: "bg-blue-600" },
    green: { bg: "bg-green-50", border: "border-green-200", badge: "bg-green-100 text-green-700", header: "bg-green-600" },
    orange: { bg: "bg-orange-50", border: "border-orange-200", badge: "bg-orange-100 text-orange-700", header: "bg-orange-600" },
    purple: { bg: "bg-purple-50", border: "border-purple-200", badge: "bg-purple-100 text-purple-700", header: "bg-purple-600" },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className={`bg-white rounded-2xl border ${c.border} shadow-sm overflow-hidden`}>
      {/* Section header */}
      <div className={`${c.header} px-6 py-4`}>
        <h3 className="text-lg font-bold text-white">{title}</h3>
      </div>

{/* DYNAMIC INVENTORY TABLE */}

<table className="w-full border border-gray-300 mb-8">
  <thead>
    <tr className="bg-gray-100">

      <th className="border p-2 text-left font-bold">
        ITEM
      </th>

      {Array.from(
        new Set(
          Object.values(
            project.inventorySummary || {}
          ).flatMap((item) =>
            Object.keys(item).filter(
              (key) =>
                !key.endsWith("_unit")
            )
          )
        )
      ).map((column) => (

        <th
          key={column}
          className="border p-2 text-left font-bold"
        >
          {column
            .replaceAll("_", " ")
            .toUpperCase()}
        </th>

      ))}

    </tr>
  </thead>

  <tbody>

    {Object.entries(
      project.inventorySummary || {}
    ).map(([itemName, data]) => (

      <tr key={itemName}>

        <td className="border p-2 font-semibold">
          {itemName}
        </td>

        {Array.from(
          new Set(
            Object.values(
              project.inventorySummary || {}
            ).flatMap((item) =>
              Object.keys(item).filter(
                (key) =>
                  !key.endsWith("_unit")
              )
            )
          )
        ).map((column) => (

          <td
            key={column}
            className="border p-2"
          >
            {data[column] ?? "-"}
            {" "}
            {data[`${column}_unit`] || ""}
          </td>

        ))}

      </tr>

    ))}

  </tbody>
</table>

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        {summary && Object.keys(summary).length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(summary).map(([key, value]) => (
                <div key={key} className={`${c.bg} rounded-xl p-4 border ${c.border}`}>
                  <p className="text-xs text-gray-500 mb-1 capitalize">{key.replace(/_/g, " ")}</p>
                  <p className="text-xl font-bold text-gray-800">{value ?? "—"}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tables */}
        {tables?.map((table, i) => (
          <div key={i}>
            <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
              {table.projectName && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${c.badge}`}>{table.projectName}</span>
              )}
              {table.title}
              <span className="text-xs text-gray-400">({table.entries?.length || 0} entries)</span>
            </h4>

            {table.entries?.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No entries for this period.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {table.columns?.map((col) => (
                        <th key={col.key} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {table.entries?.map((row, ri) => (
                      <tr key={ri} className="hover:bg-gray-50 transition-colors">
                        {table.columns?.map((col) => (
                          <td key={col.key} className="px-4 py-3 text-gray-700 whitespace-nowrap">
                            {col.key === "status" ? (
                              <StatusBadge status={row[col.key]} />
                            ) : col.key === "lowStock" && row[col.key] ? (
                              <span className="text-red-600 font-semibold flex items-center gap-1">
                                ⚠️ {row.remainingQty}
                              </span>
                            ) : (
                              row[col.key] ?? "—"
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    approved: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    denied: "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${map[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}
