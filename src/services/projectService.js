// src/services/projectService.js
import {
  doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  collection, query, where, serverTimestamp, onSnapshot, orderBy,
} from 'firebase/firestore'
import { db } from '@/firebase'

// ─── Create project ───────────────────────────────────────────────────────────
export async function createProject(orgId, projectData) {
  const ref = doc(collection(db, 'projects'))

  const data = {
    id: ref.id,
    orgId,

    name: projectData.name?.trim() || '',
    description: projectData.description || '',
    createdBy: projectData.createdBy,

    createdAt: serverTimestamp(),

    assignedEmployees: [],
    status: 'active',
  }

  await setDoc(ref, data)

  return {
    id: ref.id,
    ...data,
  }
}

// ─── Get all projects for org ─────────────────────────────────────────────────
export function subscribeToProjects(orgId, callback) {
  const q = query(
    collection(db, 'projects'),
    where('orgId', '==', orgId),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

// ─── Get projects for an employee ────────────────────────────────────────────
export function subscribeToMyProjects(orgId, userId, callback) {
  const q = query(
    collection(db, 'projects'),
    where('orgId', '==', orgId),
    where('assignedEmployees', 'array-contains', userId),
    where('status', '==', 'active')
  )
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

// ─── Assign / remove employee ─────────────────────────────────────────────────
export async function assignEmployee(projectId, userId) {
  const ref  = doc(db, 'projects', projectId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Project not found')
  const current = snap.data().assignedEmployees || []
  if (current.includes(userId)) return
  await updateDoc(ref, { assignedEmployees: [...current, userId] })
}

export async function removeEmployee(projectId, userId) {
  const ref  = doc(db, 'projects', projectId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Project not found')
  const current = snap.data().assignedEmployees || []
  await updateDoc(ref, { assignedEmployees: current.filter(id => id !== userId) })
}

// ─── Update project ───────────────────────────────────────────────────────────
export async function updateProject(projectId, updates) {
  await updateDoc(doc(db, 'projects', projectId), updates)
}

// ─── Archive project ──────────────────────────────────────────────────────────
export async function archiveProject(projectId) {
  await updateDoc(doc(db, 'projects', projectId), { status: 'archived' })
}

// ─── Get single project ───────────────────────────────────────────────────────
export async function getProject(projectId) {
  const snap = await getDoc(doc(db, 'projects', projectId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}



export async function getProjects(orgId) {
  const q = query(
    collection(db, 'projects'),
    where('orgId', '==', orgId)
  )

  const snap = await getDocs(q)

  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
}

