import {
  getDocs,
  collection,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase";

export async function generateReport({
  orgId,
  projectIds,
  startDate,
  endDate,
  projects = [],
}) {
  const report = {
    generatedAt: new Date().toISOString(),
    dateRange: {
      startDate,
      endDate,
    },
    projects: [],
  };

  for (const projectId of projectIds) {

  const projectInfo =
    projects.find(
      (p) => p.id === projectId
    );

    const q = query(
      collection(db, "inventoryEntries"),
      where("orgId", "==", orgId),
      where("projectId", "==", projectId),
      where("status", "==", "approved")
    );

    const snap = await getDocs(q);

    const entries = snap.docs
      .map((d) => d.data())
      .filter(
        (e) =>
          e.date >= startDate &&
          e.date <= endDate
      );

    const grouped = {};

    entries.forEach((entry) => {

      const itemName =
        entry.name
          ?.trim()
          .toUpperCase();

      if (!itemName) return;

      if (!grouped[itemName]) {
        grouped[itemName] = {};
      }

      Object.keys(entry).forEach(
        (key) => {

          const ignoredFields = [
            "id",
            "orgId",
            "projectId",
            "status",
            "submittedBy",
            "approvedBy",
            "submittedAt",
            "approvedAt",
            "date",
            "name",
          ];

          if (
            ignoredFields.includes(key) ||
            key.endsWith("_unit")
          ) {
            return;
          }

          const value =
            Number(entry[key]);

          if (!isNaN(value)) {

            grouped[itemName][key] =
              (grouped[itemName][key] || 0) +
              value;

            const unit =
              entry[
                `${key}_unit`
              ];

            if (unit) {
              grouped[itemName][
                `${key}_unit`
              ] = unit;
            }
          }
        }
      );
    });

    report.projects.push({
  projectId,

  projectName:
    projectInfo?.name ||
    projectId,

  inventorySummary:
    grouped,

  inventoryEntries:
    entries,
});
  }

  console.log(
    "FINAL REPORT:",
    report
  );

  console.log(
  "REPORT PROJECTS:",
  report.projects
);

  return report;
}