import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, where, serverTimestamp, getDocs
} from 'firebase/firestore';
import { db } from '../firebase';

const getFinancePath = (orgId, projectId) => `finance/${orgId}_${projectId}`;

// ── Columns ──────────────────────────────────────────────────────────────────

export const addFinanceColumn = async (orgId, projectId, column) => {
  const ref = collection(db, getFinancePath(orgId, projectId), 'columns');
  return addDoc(ref, { ...column, createdAt: serverTimestamp() });
};

export const getFinanceColumns = (orgId, projectId, callback) => {
  const ref = collection(db, getFinancePath(orgId, projectId), 'columns');
  return onSnapshot(ref, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
};

export const updateFinanceColumn = async (orgId, projectId, colId, updates) => {
  const ref = doc(db, getFinancePath(orgId, projectId), 'columns', colId);
  return updateDoc(ref, updates);
};

export const deleteFinanceColumn = async (orgId, projectId, colId) => {
  const ref = doc(db, getFinancePath(orgId, projectId), 'columns', colId);
  return deleteDoc(ref);
};

// ── Entries ───────────────────────────────────────────────────────────────────

export const submitFinanceEntry = async (orgId, projectId, entry, userId, role) => {
  const ref = collection(db, getFinancePath(orgId, projectId), 'entries');
  const status = role === 'employee' ? 'pending' : 'approved';
  return addDoc(ref, {
    ...entry,
    submittedBy: userId,
    approvedBy: role !== 'employee' ? userId : null,
    status,
    createdAt: serverTimestamp(),
  });
};

export const approveFinanceEntry = async (orgId, projectId, entryId, approverId) => {
  const ref = doc(db, getFinancePath(orgId, projectId), 'entries', entryId);
  return updateDoc(ref, { status: 'approved', approvedBy: approverId });
};

export const denyFinanceEntry = async (orgId, projectId, entryId) => {
  const ref = doc(db, getFinancePath(orgId, projectId), 'entries', entryId);
  return updateDoc(ref, { status: 'denied' });
};

export const getFinanceEntries = (orgId, projectId, callback) => {
  const ref = collection(db, getFinancePath(orgId, projectId), 'entries');
  const q = query(ref, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
};

export const getFinanceEntriesByDateRange = async (orgId, projectId, startDate, endDate) => {
  const ref = collection(db, getFinancePath(orgId, projectId), 'entries');
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

export const deleteFinanceEntry = async (orgId, projectId, entryId) => {
  const ref = doc(db, getFinancePath(orgId, projectId), 'entries', entryId);
  return deleteDoc(ref);
};



// Compatibility export
export const addFinanceEntry = submitFinanceEntry;