import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function PDFExport() {
  const navigate = useNavigate();
  const location = useLocation();
  const printRef = useRef();
  const [downloading, setDownloading] = useState(false);
  const [done, setDone] = useState(false);

  const { reportData, dateRange } = location.state || {};

  if (!reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">No report data. <button onClick={() => navigate(-1)} className="text-blue-600 underline">Go Back</button></p>
      </div>
    );
  }

  console.log("PDF DATA:", reportData);
  const { projects, generatedAt } = reportData;

  const handleDownload = async () => {
    if (!printRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const fileName = `EasyTrack_Report_${dateRange?.from}_to_${dateRange?.to}.pdf`;
      pdf.save(fileName);
      setDone(true);
    } catch (e) {
      console.error("PDF generation error:", e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Control bar */}
      <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm print:hidden">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 text-sm">
          ← Back to Preview
        </button>
        <span className="text-sm font-semibold text-gray-700">PDF Export</span>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors"
        >
          {downloading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Generating PDF…
            </>
          ) : done ? (
            "✓ Downloaded!"
          ) : (
            "⬇ Download PDF"
          )}
        </button>
      </div>

      {/* PDF Content */}
      <div className="max-w-4xl mx-auto py-6 px-4">
        <div
          ref={printRef}
          style={{ background: "#fff", fontFamily: "'Segoe UI', sans-serif", color: "#111" }}
          className="p-8 shadow-xl rounded-xl"
        >
          {/* PDF Header */}
          <div style={{ borderBottom: "3px solid #2563eb", paddingBottom: 20, marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1e40af", margin: 0 }}>EasyTrack</h1>
                <p style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>Resource & Operations Report</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 13, color: "#374151", margin: 0 }}>
                  <strong>Period:</strong> {dateRange?.from} to {dateRange?.to}
                </p>
                <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                  Generated: {format(new Date(generatedAt || Date.now()), "dd MMM yyyy, hh:mm a")}
                </p>
                <p style={{ fontSize: 12, color: "#374151" }}>
                  Projects: {projects?.map((p) => p.name).join(", ")}
                </p>
              </div>
            </div>
          </div>

          {/* Sections */}
          {projects?.map((project) => (
  <div
    key={project.projectId}
    style={{
      marginBottom: 30,
      border: "1px solid #dbeafe",
      borderRadius: 12,
      overflow: "hidden"
    }}
  >
    <div
      style={{
        background: "#2563eb",
        color: "#fff",
        padding: "12px 16px",
        fontWeight: 700
      }}
    >
      INVENTORY REPORT
    </div>

    <div
  style={{
    padding: "16px",
    background: "#f8fafc"
  }}
>
  <p>
    <strong>Project:</strong>{" "}
    {project.projectName || project.projectId}
  </p>

  <p>
    <strong>Items Found:</strong>{" "}
    {Object.keys(
      project.inventorySummary || {}
    ).length}
  </p>

  {/* Summary Cards */}

  <div
    style={{
      display: "flex",
      gap: 12,
      marginTop: 16,
      flexWrap: "wrap"
    }}
  >

    <div
      style={{
        border: "1px solid #dbeafe",
        background: "#eff6ff",
        padding: 12,
        borderRadius: 8,
        minWidth: 120
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#6b7280"
        }}
      >
        Total Items
      </div>

      <div
        style={{
          fontSize: 22,
          fontWeight: 700
        }}
      >
        {
          Object.keys(
            project.inventorySummary || {}
          ).length
        }
      </div>
    </div>

    <div
      style={{
        border: "1px solid #dbeafe",
        background: "#eff6ff",
        padding: 12,
        borderRadius: 8,
        minWidth: 120
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#6b7280"
        }}
      >
        Transactions Done
      </div>

      <div
        style={{
          fontSize: 22,
          fontWeight: 700
        }}
      >
        {project.inventoryEntries?.length || 0}
      </div>
    </div>

  </div>
</div>

{/* Inventory Entries Table */}

{project.inventoryEntries?.length > 0 && (

  <div style={{ padding: 16 }}>

  <table
    style={{
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 11
    }}
  >

    <thead>

      <tr
        style={{
          background: "#f3f4f6"
        }}
      >

        <th
          style={{
            border: "1px solid #d1d5db",
            padding: 8,
            textAlign: "left"
          }}
        >
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
            style={{
              border: "1px solid #d1d5db",
              padding: 8,
              textAlign: "left"
            }}
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

          <td
            style={{
              border: "1px solid #d1d5db",
              padding: 8,
              fontWeight: 600
            }}
          >
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
              style={{
                border: "1px solid #d1d5db",
                padding: 8
              }}
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

)}
    <div style={{ padding: 16 }}>
      {Object.entries(
        project.inventorySummary || {}
      ).map(([itemName, data]) => (
        <div
          key={itemName}
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: 12,
            marginBottom: 12
          }}
        >
          <h3>{itemName}</h3>

          {Object.entries(data).map(
            ([key, value]) => {

              if (
                key.endsWith("_unit")
              ) {
                return null;
              }

              return (
                <div key={key}>
                  <strong>
                    {key
                      .replaceAll(
                        "_",
                        " "
                      )
                      .toUpperCase()}
                  </strong>

                  {" = "}

                  {value}

                  {" "}

                  {
                    data[
                      `${key}_unit`
                    ]
                  }
                </div>
              );
            }
          )}
        </div>
      ))}
    </div>
    {/* FINANCE REPORT */}

<div
  style={{
    marginTop: 20,
    border: "1px solid #dbeafe",
    borderRadius: 12,
    overflow: "hidden"
  }}
>
  <div
    style={{
      background: "#16a34a",
      color: "#fff",
      padding: "12px 16px",
      fontWeight: 700
    }}
  >
    FINANCE REPORT
  </div>

  <div style={{ padding: 16 }}>

    {/* Summary */}

    <div
      style={{
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        marginBottom: 20
      }}
    >

      <div
        style={{
          border: "1px solid #d1d5db",
          borderRadius: 8,
          padding: 12,
          minWidth: 160
        }}
      >
        <div>Total Income</div>

        <div
          style={{
            color: "#16a34a",
            fontSize: 20,
            fontWeight: 700
          }}
        >
          ₹{Number(
            project.financeSummary?.totalIncome || 0
          ).toLocaleString()}
        </div>
      </div>

      <div
        style={{
          border: "1px solid #d1d5db",
          borderRadius: 8,
          padding: 12,
          minWidth: 160
        }}
      >
        <div>Total Expense</div>

        <div
          style={{
            color: "#dc2626",
            fontSize: 20,
            fontWeight: 700
          }}
        >
          ₹{Number(
            project.financeSummary?.totalExpense || 0
          ).toLocaleString()}
        </div>
      </div>

      <div
        style={{
          border: "1px solid #d1d5db",
          borderRadius: 8,
          padding: 12,
          minWidth: 160
        }}
      >
        <div>Balance</div>

        <div
          style={{
            color: "#2563eb",
            fontSize: 20,
            fontWeight: 700
          }}
        >
          ₹{Number(
            project.financeSummary?.balance || 0
          ).toLocaleString()}
        </div>
      </div>

    </div>

    {/* TOP PARTIES */}

    <h3
      style={{
        marginBottom: 12,
        fontSize: 18,
        fontWeight: 700
      }}
    >
      Top Parties
    </h3>

    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 12
      }}
    >

      {Object.entries(
        project.partySummary || {}
      )
        .sort(
          (a, b) =>
            Math.abs(b[1].net) -
            Math.abs(a[1].net)
        )
        .slice(0, 10)
        .map(([name, data]) => (

          <div
            key={name}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 8,
              padding: 12,
              width: 220
            }}
          >

            <div
              style={{
                fontWeight: 700,
                fontSize: 16
              }}
            >
              {name}
            </div>

            <div>
              Transactions: {data.count}
            </div>

            <div
              style={{
                color: "#16a34a"
              }}
            >
              Income:
              ₹{Number(
                data.income || 0
              ).toLocaleString()}
            </div>

            <div
              style={{
                color: "#dc2626"
              }}
            >
              Expense:
              ₹{Number(
                data.expense || 0
              ).toLocaleString()}
            </div>

            {data.net >= 0 ? (

              <div
                style={{
                  color: "#16a34a",
                  fontWeight: 700,
                  marginTop: 6
                }}
              >
                NET PROFIT:
                ₹{Number(
                  data.net
                ).toLocaleString()}
              </div>

            ) : (

              <div
                style={{
                  color: "#dc2626",
                  fontWeight: 700,
                  marginTop: 6
                }}
              >
                NET LOSS:
                -₹{Number(
                  Math.abs(data.net)
                ).toLocaleString()}
              </div>

            )}

          </div>

        ))}

    </div>

  </div>
</div>


  </div>

  
))}

          {/* Footer */}
          <div style={{ marginTop: 32, paddingTop: 16, borderTop: "1px solid #e5e7eb", textAlign: "center" }}>
            <p style={{ fontSize: 10, color: "#9ca3af" }}>
              Powered by EasyTrack · Confidential Report · {format(new Date(), "dd MMM yyyy")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PDFSection({ title, color, section }) {
  if (!section) return null;
  const { summary, tables } = section;

  return (
    <div style={{ marginBottom: 32 }}>
      {/* Section title */}
      <div style={{ background: color, color: "#fff", padding: "8px 16px", borderRadius: 8, marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0, letterSpacing: 1 }}>{title}</h2>
      </div>

      {/* Summary */}
      {summary && Object.keys(summary).length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
            Summary
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {Object.entries(summary).map(([k, v]) => (
              <div
                key={k}
                style={{
                  border: `1px solid ${color}40`,
                  background: `${color}10`,
                  borderRadius: 8,
                  padding: "8px 14px",
                  minWidth: 120,
                }}
              >
                <p style={{ fontSize: 10, color: "#6b7280", margin: 0, textTransform: "capitalize" }}>{k.replace(/_/g, " ")}</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: "2px 0 0" }}>{v ?? "—"}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tables */}
      {tables?.map((table, i) => (
        <div key={i} style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
            {table.projectName && <span style={{ color, marginRight: 6 }}>[{table.projectName}]</span>}
            {table.title} — {table.entries?.length || 0} entries
          </p>

          {table.entries?.length === 0 ? (
            <p style={{ fontSize: 11, color: "#9ca3af", fontStyle: "italic" }}>No entries for this period.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ background: "#f3f4f6" }}>
                  {table.columns?.map((col) => (
                    <th
                      key={col.key}
                      style={{
                        padding: "6px 10px",
                        textAlign: "left",
                        fontWeight: 600,
                        color: "#6b7280",
                        fontSize: 10,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        borderBottom: "2px solid #e5e7eb",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.entries?.map((row, ri) => (
                  <tr
                    key={ri}
                    style={{ borderBottom: "1px solid #f3f4f6", background: ri % 2 === 0 ? "#fff" : "#fafafa" }}
                  >
                    {table.columns?.map((col) => (
                      <td
                        key={col.key}
                        style={{
                          padding: "6px 10px",
                          color: col.key === "lowStock" && row[col.key] ? "#dc2626" : "#374151",
                          fontWeight: col.key === "lowStock" && row[col.key] ? 700 : 400,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {col.key === "status" ? (
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: 100,
                              background:
                                row[col.key] === "approved" ? "#d1fae5" : row[col.key] === "pending" ? "#fef9c3" : "#fee2e2",
                              color:
                                row[col.key] === "approved" ? "#065f46" : row[col.key] === "pending" ? "#92400e" : "#991b1b",
                              fontSize: 10,
                              fontWeight: 600,
                              textTransform: "capitalize",
                            }}
                          >
                            {row[col.key]}
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
          )}
        </div>
      ))}
    </div>
  );
}
