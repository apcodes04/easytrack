// src/services/orgService.js
import {
  doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  collection, query, where, serverTimestamp, onSnapshot,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { generateOrgKey } from '@/utils/generateOrgKey'

// ─── Create Organization ──────────────────────────────────────────────────────
export async function createOrganization(userId, orgName) {
  let uniqueKey
  let attempts = 0

  // Ensure uniqueness
  while (true) {
    uniqueKey = generateOrgKey()
    const existing = await getOrgByKey(uniqueKey)
    if (!existing) break
    if (++attempts > 10) throw new Error('Could not generate unique key, try again')
  }

  const orgRef = doc(collection(db, 'organizations'))
  const orgData = {
    id:        orgRef.id,
    name:      orgName.trim(),
    uniqueKey,
    createdBy: userId,
    createdAt: serverTimestamp(),
    industry:  'general',
  }
  await setDoc(orgRef, orgData)

  // Add creator as manager
  await setDoc(doc(db, 'organizations', orgRef.id, 'members', userId), {
    userId,
    role:        'manager',
    permissions: ['inventory', 'finance', 'employee', 'reports', 'chat'],
    joinedAt:    serverTimestamp(),
    approvedBy:  userId,
    status:      'active',
  })

  // Update user doc with orgId
  await updateDoc(doc(db, 'users', userId), {
    orgIds: [orgRef.id],
    currentOrgId: orgRef.id,
  }).catch(() =>
    setDoc(doc(db, 'users', userId), { orgIds: [orgRef.id], currentOrgId: orgRef.id }, { merge: true })
  )

  return { id: orgRef.id, ...orgData }
}

// ─── Get org by unique key ────────────────────────────────────────────────────
export async function getOrgByKey(uniqueKey) {
  const q    = query(collection(db, 'organizations'), where('uniqueKey', '==', uniqueKey))
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() }
}

// ─── Request to join org ──────────────────────────────────────────────────────
export async function requestJoinOrg(orgId, userId, displayName, phone) {
  // Check not already a member
  const memberSnap = await getDoc(doc(db, 'organizations', orgId, 'members', userId))
  if (memberSnap.exists()) throw new Error('You are already a member of this organization')

  // Check no pending request
  const existing = await getDoc(doc(db, 'organizations', orgId, 'joinRequests', userId))
  if (existing.exists() && existing.data().status === 'pending')
    throw new Error('Your join request is already pending')

  await setDoc(doc(db, 'organizations', orgId, 'joinRequests', userId), {
    userId,
    displayName: displayName || '',
    phone:       phone       || '',
    status:      'pending',
    requestedAt: serverTimestamp(),
  })
}

// ─── Approve / Deny join request ─────────────────────────────────────────────
export async function approveJoinRequest(orgId, targetUserId, approverId) {
  await setDoc(doc(db, 'organizations', orgId, 'members', targetUserId), {
    userId:      targetUserId,
    role:        'employee',
    permissions: [],
    joinedAt:    serverTimestamp(),
    approvedBy:  approverId,
    status:      'active',
  })
  await updateDoc(doc(db, 'organizations', orgId, 'joinRequests', targetUserId), {
    status: 'approved',
  })
  // Update user doc
  const userRef =
  doc(db, "users", targetUserId);

const userSnap =
  await getDoc(userRef);

const existingOrgIds =
  userSnap.data()?.orgIds || [];

await setDoc(
  userRef,
  {
    currentOrgId: orgId,
    orgIds: [
      ...new Set([
        ...existingOrgIds,
        orgId,
      ]),
    ],
  },
  { merge: true }
);
}

export async function denyJoinRequest(orgId, targetUserId) {
  await updateDoc(doc(db, 'organizations', orgId, 'joinRequests', targetUserId), {
    status: 'denied',
  })
}

// ─── Change member role ───────────────────────────────────────────────────────
// promoteTo: 'asst_manager' | 'manager' | 'employee'
export async function changeMemberRole(orgId, targetUserId, newRole, permissions = []) {
  const VALID = ['employee', 'asst_manager', 'manager']
  if (!VALID.includes(newRole)) throw new Error('Invalid role')
  await updateDoc(doc(db, 'organizations', orgId, 'members', targetUserId), {
    role: newRole,
    permissions: newRole === 'manager'
      ? ['inventory', 'finance', 'employee', 'reports', 'chat']
      : permissions,
  })
}

// ─── Update asst manager permissions ─────────────────────────────────────────
export async function updatePermissions(orgId, targetUserId, permissions) {
  await updateDoc(doc(db, 'organizations', orgId, 'members', targetUserId), { permissions })
}

// ─── Get all members ──────────────────────────────────────────────────────────
export async function getMembers(orgId) {
  const snap = await getDocs(collection(db, 'organizations', orgId, 'members'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─── Get pending join requests ────────────────────────────────────────────────
export function subscribeToJoinRequests(orgId, callback) {
  const q = query(
    collection(db, 'organizations', orgId, 'joinRequests'),
    where('status', '==', 'pending')
  )
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

// ─── Get org (once) ───────────────────────────────────────────────────────────
export async function getOrg(orgId) {
  const snap = await getDoc(doc(db, 'organizations', orgId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// ─── Get member data for a user ───────────────────────────────────────────────
export async function getMemberData(orgId, userId) {
  const snap = await getDoc(doc(db, 'organizations', orgId, 'members', userId))
  return snap.exists() ? snap.data() : null
}

// Compatibility exports for UI components

export const getPendingJoinRequests = subscribeToJoinRequests;

export const getOrgMembers = getMembers;

export async function promoteUser(orgId, userId) {
  return changeMemberRole(orgId, userId, 'asst_manager');
}

export async function demoteUser(orgId, userId) {
  return changeMemberRole(orgId, userId, 'employee');
}

export async function removeUserFromOrg(orgId, userId) {
  await deleteDoc(doc(db, 'organizations', orgId, 'members', userId));
}

export async function updateOrganizationName(
  orgId,
  name
) {
  await updateDoc(
    doc(db, "organizations", orgId),
    {
      name: name.trim(),
    }
  );
}