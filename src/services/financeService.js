// src/services/financeService.js

import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";

import { db } from "@/firebase";


const featureBase = (orgId, projectId) =>
  `${orgId}_${projectId}`;

// ─────────────────────────────────────────────
// COLUMN DEFINITIONS
// ─────────────────────────────────────────────

export async function saveColumns(
  orgId,
  projectId,
  columns
) {
  const ref = doc(
    db,
    "financeMeta",
    featureBase(orgId, projectId)
  );

  await setDoc(
    ref,
    {
      columns,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getColumns(
  orgId,
  projectId
) {
  const snap = await getDoc(
    doc(
      db,
      "financeMeta",
      featureBase(orgId, projectId)
    )
  );

  return snap.exists()
    ? snap.data().columns || []
    : [];
}

export function subscribeToColumns(
  orgId,
  projectId,
  callback
) {
  return onSnapshot(
    doc(
      db,
      "financeMeta",
      featureBase(orgId, projectId)
    ),
    (snap) => {
      callback(
        snap.exists()
          ? snap.data().columns || []
          : []
      );
    }
  );
}

export async function deleteColumn(
  orgId,
  projectId,
  columnId
) {
  const columns = await getColumns(
    orgId,
    projectId
  );

  const updated = columns.filter(
    (col) => col.id !== columnId
  );

  await saveColumns(
    orgId,
    projectId,
    updated
  );
}

export async function updateColumn(
  orgId,
  projectId,
  columnId,
  updates
) {
  const columns = await getColumns(
    orgId,
    projectId
  );

  const updated = columns.map((col) =>
    col.id === columnId
      ? {
          ...col,
          ...updates,
        }
      : col
  );

  await saveColumns(
    orgId,
    projectId,
    updated
  );
}

// ─────────────────────────────────────────────
// FINANCE ENTRIES
// ─────────────────────────────────────────────

export async function addEntry(
  orgId,
  projectId,
  entryData,
  submittedBy,
  isManagerOrAsst
) {
  const ref = doc(
    collection(db, "financeEntries")
  );

  const data = {
    id: ref.id,

    orgId,
    projectId,

    ...entryData,

    submittedBy,

    submittedAt:
      serverTimestamp(),

    status:
      isManagerOrAsst
        ? "approved"
        : "pending",

    approvedBy:
      isManagerOrAsst
        ? submittedBy
        : null,

    approvedAt:
      isManagerOrAsst
        ? serverTimestamp()
        : null,
  };

  await setDoc(ref, data);

  return data;
}

export async function updateEntry(
  entryId,
  updatedData
) {
  await updateDoc(
    doc(
      db,
      "financeEntries",
      entryId
    ),
    updatedData
  );
}

export async function deleteEntry(
  entryId
) {
  await deleteDoc(
    doc(
      db,
      "financeEntries",
      entryId
    )
  );
}

export async function approveEntry(
  entryId,
  approverId
) {
  await updateDoc(
    doc(
      db,
      "financeEntries",
      entryId
    ),
    {
      status: "approved",
      approvedBy: approverId,
      approvedAt:
        serverTimestamp(),
    }
  );
}

export async function rejectEntry(
  entryId,
  approverId
) {
  await updateDoc(
    doc(
      db,
      "financeEntries",
      entryId
    ),
    {
      status: "rejected",
      approvedBy: approverId,
      approvedAt:
        serverTimestamp(),
    }
  );
}

export function subscribeToEntries(
  orgId,
  projectId,
  callback
) {
  const q = query(
    collection(db, "financeEntries"),
    where("orgId", "==", orgId),
    where(
      "projectId",
      "==",
      projectId
    )
  );

  return onSnapshot(
    q,
    (snap) => {
      const entries = snap.docs.map(
        (docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })
      );

      callback(entries);
    },
    (err) => {
      console.error(
        "FINANCE SUBSCRIBE ERROR:",
        err
      );
    }
  );
}

// ─────────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────────

export async function getEntriesForReport(
  orgId,
  projectId,
  from,
  to
) {
  const q = query(
    collection(db, "financeEntries"),
    where("orgId", "==", orgId),
    where(
      "projectId",
      "==",
      projectId
    ),
    where(
      "status",
      "==",
      "approved"
    )
  );

  const snap = await getDocs(q);

  return snap.docs
    .map((d) => ({
      id: d.id,
      ...d.data(),
    }))
    .filter(
      (entry) =>
        (!from ||
          entry.date >= from) &&
        (!to ||
          entry.date <= to)
    );
}

// ─────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────

export async function getExistingCategories(
  orgId,
  projectId
) {
  const q = query(
    collection(db, "financeEntries"),
    where("orgId", "==", orgId),
    where(
      "projectId",
      "==",
      projectId
    )
  );

  const snap = await getDocs(q);

  return [
    ...new Set(
      snap.docs
        .map(
          (d) =>
            d.data()?.category
        )
        .filter(Boolean)
    ),
  ];
}

// ─────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────

export async function getFinanceSummary(
  orgId,
  projectId
) {
  const q = query(
    collection(db, "financeEntries"),
    where("orgId", "==", orgId),
    where(
      "projectId",
      "==",
      projectId
    )
  );

  const snap = await getDocs(q);

  const entries = snap.docs.map(
    (d) => d.data()
  );

  let income = 0;
  let expense = 0;

  entries.forEach((entry) => {
    const amount =
      Number(entry.amount || 0);

    if (
      entry.type === "INCOME"
    ) {
      income += amount;
    }

    if (
      entry.type === "EXPENSE"
    ) {
      expense += amount;
    }
  });

  return {
    income,
    expense,
    balance:
      income - expense,
  };
}

// ─────────────────────────────────────────────
// FORMULAS
// ─────────────────────────────────────────────

export async function saveFormulas(
  orgId,
  projectId,
  formulas
) {
  const ref = doc(
    db,
    "financeMeta",
    featureBase(orgId, projectId)
  );

  await setDoc(
    ref,
    {
      formulas,
      updatedAt:
        serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getFormulas(
  orgId,
  projectId
) {
  const snap = await getDoc(
    doc(
      db,
      "financeMeta",
      featureBase(orgId, projectId)
    )
  );

  if (!snap.exists()) {
    return [];
  }

  return (
    snap.data().formulas || []
  );
}

export async function addTransaction(
  orgId,
  projectId,
  transactionData,
  submittedBy,
  isManagerOrAsst
) {
  return addEntry(
    orgId,
    projectId,
    transactionData,
    submittedBy,
    isManagerOrAsst
  );
}

export async function updateTransaction(
  transactionId,
  updatedData
) {
  return updateEntry(
    transactionId,
    updatedData
  );
}

export async function deleteTransaction(
  transactionId
) {
  return deleteEntry(
    transactionId
  );
}

export function subscribeToTransactions(
  orgId,
  projectId,
  callback
) {
  return subscribeToEntries(
    orgId,
    projectId,
    callback
  );
}

export async function getExistingTransactionNames(
  orgId,
  projectId
) {
  const q = query(
    collection(db, "financeEntries"),
    where("orgId", "==", orgId),
    where("projectId", "==", projectId)
  );

  const snap = await getDocs(q);

  return [
    ...new Set(
      snap.docs
        .map((d) => d.data()?.name)
        .filter(Boolean)
    ),
  ];
}