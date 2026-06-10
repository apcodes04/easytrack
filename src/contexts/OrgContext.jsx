// src/contexts/OrgContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { doc, onSnapshot, getDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuth } from './AuthContext'

export const OrgContext = createContext(null)

export function OrgProvider({ children }) {
  const { user } = useAuth()
  const [currentOrg,  setCurrentOrg]  = useState(null)
  const [memberData,  setMemberData]  = useState(null) // role + permissions
  const [loadingOrg,  setLoadingOrg]  = useState(true)

  const [orgId, setOrgId] = useState(() => localStorage.getItem('et_orgId') || null) 
  useEffect(() => {
  async function loadCurrentOrg() {
    if (!user || orgId) return

    const userSnap = await getDoc(
      doc(db, 'users', user.uid)
    )

    if (!userSnap.exists()) {
      setLoadingOrg(false)
      return
    }

    const data = userSnap.data()

    if (false && data?.currentOrgId) {
      localStorage.setItem(
        'et_orgId',
        data.currentOrgId
      )

      setOrgId(data.currentOrgId)
    } else {
      setLoadingOrg(false)
    }
  }

  loadCurrentOrg()
}, [user, orgId])


  useEffect(() => {
    if (!orgId) { setLoadingOrg(false); return }
    const unsub = onSnapshot(doc(db, 'organizations', orgId), (snap) => {
      if (snap.exists()) setCurrentOrg({ id: snap.id, ...snap.data() })
      else { setCurrentOrg(null); clearOrg() }
      setLoadingOrg(false)
    })
    return unsub
  }, [orgId])

  useEffect(() => {
    if (!orgId || !user) return
    const unsub = onSnapshot(doc(db, 'organizations', orgId, 'members', user.uid), (snap) => {
      if (snap.exists()) setMemberData(snap.data())
    })
    return unsub
  }, [orgId, user])

  const switchOrg = (id) => {
    localStorage.setItem('et_orgId', id)
    setOrgId(id)
  }

  const clearOrg = () => {
    localStorage.removeItem('et_orgId')
    setOrgId(null)
    setCurrentOrg(null)
    setMemberData(null)
  }

  // Helper permission checks
  const isManager      = memberData?.role === 'manager'
  const isAsstManager  = memberData?.role === 'asst_manager'
  const isEmployee     = memberData?.role === 'employee'
  const canApprove     = isManager || isAsstManager

  const hasPermission  = (feature) => {
    if (isManager) return true
    if (isAsstManager) return memberData?.permissions?.includes(feature) ?? false
    return false
  }

  return (
    <OrgContext.Provider value={{
  currentOrg,
  org: currentOrg,

  memberData,
  loadingOrg,

  orgId,
  switchOrg,
  clearOrg,

  isManager,
  isAsstManager,
  isEmployee,
  canApprove,

  hasPermission,

  role: memberData?.role || null,
  userRole: memberData?.role || null,
}}>
      {children}
    </OrgContext.Provider>
  )
}

export function useOrg() {
  return useContext(OrgContext)
}
