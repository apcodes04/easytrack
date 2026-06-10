import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, where, serverTimestamp, getDocs
} from 'firebase/firestore';
import { db } from '../firebase';

const getEmployeePath = (orgId, projectId) => `employees/${orgId}_${projectId}`;

// ── Columns ───────────────────────────────────────────────────────────────────

export const addEmployeeColumn = async (orgId, projectId, column) => {
  const ref = collection(db, getEmployeePath(orgId, projectId), 'columns');
  return addDoc(ref, { ...column, createdAt: serverTimestamp() });
};

export const getEmployeeColumns = (orgId, projectId, callback) => {
  const ref = collection(db, getEmployeePath(orgId, projectId), 'columns');
  return onSnapshot(ref, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
};

export const deleteEmployeeColumn = async (orgId, projectId, colId) => {
  const ref = doc(db, getEmployeePath(orgId, projectId), 'columns', colId);
  return deleteDoc(ref);
};

// ── Entries ───────────────────────────────────────────────────────────────────

export const submitEmployeeEntry = async (orgId, projectId, entry, userId, role) => {
  const ref = collection(db, getEmployeePath(orgId, projectId), 'entries');
  const status = role === 'employee' ? 'pending' : 'approved';
  return addDoc(ref, {
    ...entry,
    submittedBy: userId,
    approvedBy: role !== 'employee' ? userId : null,
    status,
    createdAt: serverTimestamp(),
  });
};

export const approveEmployeeEntry = async (orgId, projectId, entryId, approverId) => {
  const ref = doc(db, getEmployeePath(orgId, projectId), 'entries', entryId);
  return updateDoc(ref, { status: 'approved', approvedBy: approverId });
};

export const denyEmployeeEntry = async (orgId, projectId, entryId) => {
  const ref = doc(db, getEmployeePath(orgId, projectId), 'entries', entryId);
  return updateDoc(ref, { status: 'denied' });
};

export const getEmployeeEntries = (orgId, projectId, callback) => {
  const ref = collection(db, getEmployeePath(orgId, projectId), 'entries');
  const q = query(ref, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
};

export const getEmployeeEntriesByDateRange = async (orgId, projectId, startDate, endDate) => {
  const ref = collection(db, getEmployeePath(orgId, projectId), 'entries');
  const q = query(
    ref,
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    where('status', '==', 'approved'),
    orderBy('date', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const deleteEmployeeEntry = async (orgId, projectId, entryId) => {
  const ref = doc(db, getEmployeePath(orgId, projectId), 'entries', entryId);
  return deleteDoc(ref);
};

// ── Org-level member management helpers ──────────────────────────────────────

export const getOrgMemberEntries = (orgId, callback) => {
  // Returns all member docs from the org's members subcollection
  const ref = collection(db, 'organizations', orgId, 'members');
  return onSnapshot(ref, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
};


// Compatibility export
export const addEmployeeEntry = submitEmployeeEntry;