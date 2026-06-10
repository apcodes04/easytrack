import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase'

export async function getUserOrganizations(userId) {
  const userSnap = await getDoc(
    doc(db, 'users', userId)
  )

  if (!userSnap.exists()) return []

  const data = userSnap.data()

  return data.orgIds || []
}