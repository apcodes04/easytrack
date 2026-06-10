import { useState, useEffect } from "react";
import { useOrg } from "../../hooks/useOrg";
import { getProjects } from "../../services/projectService";

import Button from "../../components/ui/Button";

import {
  getDocs,
  collection,
  query,
  where,
} from "firebase/firestore";

import { db } from "../../firebase";

export default function InventoryReport() {
  const { org } = useOrg();

  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [report, setReport] = useState([]);
  const [projectName, setProjectName] =
useState("");

  useEffect(() => {
    loadProjects();
  }, [org]);

  async function loadProjects() {
    if (!org) return;

    const data = await getProjects(org.id);

    console.log("ORG ID:", org?.id);
    console.log("PROJECTS LOADED:", data);

    setProjects(data);
  }

  async function generateReport() {
    if (!projectId || !fromDate || !toDate) {
      alert(
        "Please select project and date range."
      );
      return;
    }

    const selectedProject =
  projects.find(
    (p) => p.id === projectId
  );

setProjectName(
  selectedProject?.name || ""
);

    const q = query(
      collection(db, "inventoryEntries"),
      where("orgId", "==", org.id),
      where("projectId", "==", projectId),
      where("status", "==", "approved")
    );

    const snap = await getDocs(q);

    const entries = snap.docs
      .map((d) => d.data())
      .filter(
        (e) =>
          e.date >= fromDate &&
          e.date <= toDate
      );

    const grouped = {};

    entries.forEach((entry) => {
      const item = entry.name
        ?.trim()
        .toUpperCase();

      if (!item) return;

      if (!grouped[item]) {
        grouped[item] = {};
      }

      Object.keys(entry).forEach((key) => {
        if (key.endsWith("_unit")) return;

        const value = Number(entry[key]);

        if (!isNaN(value)) {
          grouped[item][key] =
            (grouped[item][key] || 0) +
            value;

          const unit =
            entry[`${key}_unit`];

          if (unit) {
            grouped[item][
              `${key}_unit`
            ] = unit;
          }
        }
      });
    });

    setReport(
      Object.entries(grouped)
    );
  }



  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
  <h1 className="text-3xl font-bold">
    INVENTORY REPORT
  </h1>

  {projectName && (
    <p className="text-gray-600 mt-1">
      PROJECT:
      <strong>
        {" "}
        {projectName.toUpperCase()}
      </strong>
    </p>
  )}
</div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <select
  value={projectId}
  onChange={(e) => {

    console.log(
      "SELECTED PROJECT:",
      e.target.value
    );

    setProjectId(
      e.target.value
    );
  }}
  className="border rounded p-2"
>
  <option value="">
    Select Project
  </option>

  {projects.map(
    (project) => (
      <option
        key={project.id}
        value={project.id}
      >
        {project.name}
      </option>
    )
  )}
</select>

        <input
          type="date"
          value={fromDate}
          onChange={(e) =>
            setFromDate(
              e.target.value
            )
          }
          className="border rounded p-2"
        />

        <input
          type="date"
          value={toDate}
          onChange={(e) =>
            setToDate(
              e.target.value
            )
          }
          className="border rounded p-2"
        />

        <Button
          onClick={generateReport}
        >
          Generate Report
        </Button>
      </div>

      <div className="space-y-6">
        {report.map(
          ([name, data]) => (
            <div
              key={name}
              className="border rounded-xl p-4"
            >
              <h2 className="text-xl font-bold mb-3">
                {name}
              </h2>

              <p className="text-sm text-gray-500 mb-3">
                {fromDate} TO {toDate}
              </p>

              {Object.entries(
                data
              ).map(
                ([key, value]) => {
                  if (
                    key.endsWith(
                      "_unit"
                    )
                  )
                    return null;

                  return (
                    <div
                      key={key}
                      className="mb-1"
                    >
                      TOTAL{" "}
                      {key
                        .replaceAll(
                          "_",
                          " "
                        )
                        .toUpperCase()}
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
          )
        )}
      </div>
    </div>
  );
}