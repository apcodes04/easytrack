// src/services/inventoryService.js
import {
  doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  collection, query, where, serverTimestamp, onSnapshot,
  orderBy, limit, Timestamp,
} from 'firebase/firestore'
import { db } from '@/firebase'

const featureBase = (orgId, projectId) => `${orgId}_${projectId}`

// ──────────────────────────────────────────────────────────────────────────────
//  COLUMN DEFINITIONS
// ──────────────────────────────────────────────────────────────────────────────
export async function saveColumns(orgId, projectId, columns) {
  const ref = doc(db, 'inventoryMeta', featureBase(orgId, projectId))
  await setDoc(ref, { columns, updatedAt: serverTimestamp() }, { merge: true })
}

export async function getColumns(orgId, projectId) {
  const snap = await getDoc(doc(db, 'inventoryMeta', featureBase(orgId, projectId)))
  return snap.exists()
 ? (snap.data().columns || [])
 : []
}

export function subscribeToColumns(orgId, projectId, callback) {
  return onSnapshot(
    doc(db, 'inventoryMeta', featureBase(orgId, projectId)),
    snap => callback(snap.exists() ? (snap.data().columns || []) : getDefaultColumns())
  )
}

export async function deleteColumn(orgId, projectId, columnId) {
  const columns = await getColumns(orgId, projectId);

  const updated = columns.filter(
    (col) => col.id !== columnId
  );

  await saveColumns(orgId, projectId, updated);
}

export async function updateColumn(
  orgId,
  projectId,
  columnId,
  updates
) {
  const columns = await getColumns(orgId, projectId);

  const updated = columns.map((col) =>
    col.id === columnId
      ? { ...col, ...updates }
      : col
  );

  await saveColumns(orgId, projectId, updated);
}
// ──────────────────────────────────────────────────────────────────────────────
//  MATERIAL PROFILES  (dropdown values for material column)
// ──────────────────────────────────────────────────────────────────────────────
export async function saveMaterialProfile(orgId, projectId, profile) {
  const ref = doc(collection(db, 'materialProfiles'))
  const data = { id: ref.id, orgId, projectId, ...profile, createdAt: serverTimestamp() }
  await setDoc(ref, data)
  return data
}

export function subscribeToMaterialProfiles(orgId, projectId, callback) {
  const q = query(
    collection(db, 'materialProfiles'),
    where('orgId', '==', orgId),
    where('projectId', '==', projectId)
  )
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
}

export async function deleteMaterialProfile(profileId) {
  await deleteDoc(doc(db, 'materialProfiles', profileId))
}

// ──────────────────────────────────────────────────────────────────────────────
//  ENTRIES
// ──────────────────────────────────────────────────────────────────────────────
// status: 'approved' | 'pending' | 'rejected'
export async function addEntry(orgId, projectId, entryData, submittedBy, isManagerOrAsst) {
  const ref = doc(collection(db, 'inventoryEntries'))
  const data = {
    id: ref.id,
    orgId, projectId,
    ...entryData,
    submittedBy,
    submittedAt:  serverTimestamp(),
    status:       isManagerOrAsst ? 'approved' : 'pending',
    approvedBy:   isManagerOrAsst ? submittedBy : null,
    approvedAt:   isManagerOrAsst ? serverTimestamp() : null,
  }
  await setDoc(ref, data)
  return data
}

export async function approveEntry(entryId, approverId) {
  await updateDoc(doc(db, 'inventoryEntries', entryId), {
    status:     'approved',
    approvedBy: approverId,
    approvedAt: serverTimestamp(),
  })
}

export async function rejectEntry(entryId, approverId) {
  await updateDoc(doc(db, 'inventoryEntries', entryId), {
    status:     'rejected',
    approvedBy: approverId,
    approvedAt: serverTimestamp(),
  })
}

export async function deleteEntry(entryId) {
  await deleteDoc(doc(db, 'inventoryEntries', entryId))
}

export async function updateEntry(entryId, updatedData) {
  await updateDoc(
    doc(db, "inventoryEntries", entryId),
    updatedData
  );
}

export function subscribeToEntries(orgId, projectId, callback, filters = {}) {

  //console.log("QUERY ORG:", orgId);
  //console.log("QUERY PROJECT:", projectId);

  let q = query(
    collection(db, "inventoryEntries"),
    where("orgId", "==", orgId),
    where("projectId", "==", projectId)
  );

  return onSnapshot(
    q,
    (snap) => {
      //console.log("SNAP SIZE:", snap.size);

      const entries = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      //console.log("FIRESTORE ENTRIES:", entries);

      callback(entries);
    },
    (error) => {
      console.error("ENTRY SUBSCRIBE ERROR:", error);
    }
  );
}

export async function getEntriesForReport(orgId, projectId, from, to) {
  const q = query(
    collection(db, 'inventoryEntries'),
    where('orgId',     '==', orgId),
    where('projectId', '==', projectId),
    where('status',    '==', 'approved'),
    orderBy('date', 'asc')
  )
  const snap = await getDocs(q)
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(e => (!from || e.date >= from) && (!to || e.date <= to))
}



// ──────────────────────────────────────────────────────────────────────────────
//  FIX: MaterialProfiles.jsx compatibility layer
// ──────────────────────────────────────────────────────────────────────────────

// wrapper for old naming used in UI
export async function addMaterialProfile(orgId, projectId, profile) {
  return await saveMaterialProfile(orgId, projectId, profile);
}

// wrapper for old naming used in UI
export async function getMaterialProfiles(orgId, projectId) {
  return new Promise((resolve, reject) => {
    const unsub = subscribeToMaterialProfiles(orgId, projectId, (data) => {
      resolve(data);
      unsub(); // one-time fetch behavior
    });
  });
}

export async function getExistingItemNames(orgId, projectId) {
  const q = query(
    collection(db, "inventoryEntries"),
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

export async function getExistingUnits(
  orgId,
  projectId,
  itemName
) {

  const q = query(
    collection(db, "inventoryEntries"),
    where("orgId", "==", orgId),
    where("projectId", "==", projectId)
  );

  const snap = await getDocs(q);

  const matches = snap.docs
    .map((d) => d.data())
    .filter(
      (e) =>
        e.name?.trim().toUpperCase() ===
        itemName?.trim().toUpperCase()
    );



  const units = [
  ...new Set(
    matches.flatMap((entry) =>
      Object.keys(entry)
        .filter((key) => key.endsWith("_unit"))
        .map((key) => entry[key])
    )
  ),
].filter(Boolean);


  return units;
}

// ─────────────────────────────────────────────────────────────
// FORMULAS
// ─────────────────────────────────────────────────────────────

export async function saveFormulas(
  orgId,
  projectId,
  formulas
) {
  const ref = doc(
    db,
    "inventoryMeta",
    featureBase(orgId, projectId)
  );

  await setDoc(
    ref,
    {
      formulas,
      updatedAt: serverTimestamp(),
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
      "inventoryMeta",
      featureBase(orgId, projectId)
    )
  );

  if (!snap.exists()) {
    return [];
  }

  return snap.data().formulas || [];
}