import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { OrgProvider, useOrg } from '@/contexts/OrgContext'

// ONLY SAFE EXISTING PAGE (keep login for now)
import Login from '@/pages/auth/Login'
import OrgChoice from '@/pages/onboarding/OrgChoice'
import CreateOrg from '@/pages/onboarding/CreateOrg'
import JoinOrg from '@/pages/onboarding/JoinOrg'

import ManagerDashboard from '@/pages/dashboard/ManagerDashboard'
import EmployeeDashboard from '@/pages/dashboard/EmployeeDashboard'
import PendingApproval from '@/pages/dashboard/PendingApproval'

import CreateProject from '@/pages/projects/CreateProject'
import ProjectDetail from '@/pages/projects/ProjectDetail'
import ProjectList from '@/pages/projects/ProjectList'

import ReportBuilder from '@/pages/reports/ReportBuilder'
import ReportPreview from '@/pages/reports/ReportPreview'
import PDFExport from '@/pages/reports/PDFExport'

import Inventory from '@/pages/projects/Inventory'
import Finance from '@/pages/projects/Finance'
import Employees from '@/pages/projects/Employees'
import ProjectChat from '@/pages/projects/ProjectChat'

import EditOrganization from '@/pages/org/EditOrganization'


function AppRoutes() {
  const { user, loading } = useAuth()
  const { currentOrg, memberData, loadingOrg, role } = useOrg()

  if (loading || loadingOrg) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    )
  }

  // NOT LOGGED IN
  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }

// NO ORG → ONBOARDING FLOW
if (!currentOrg) {
  return (
    <Routes>
      <Route path="/" element={<OrgChoice />} />
      <Route path="/create-org" element={<CreateOrg />} />
      <Route path="/join-org" element={<JoinOrg />} />
      <Route path="*" element={<OrgChoice />} />
    </Routes>
  )
}

  // PENDING APPROVAL
  if (memberData?.status === 'pending') {
    return (
      <Routes>
        <Route path="*" element={<div>Waiting for approval...</div>} />
      </Routes>
    )
  }

// MAIN APP
return (
  <Routes>

    {/* Dashboard */}
    <Route
      path="/"
      element={
        role === 'manager'
          ? <ManagerDashboard />
          : <EmployeeDashboard />
      }
    />

    {/* Projects */}
    <Route
      path="/projects"
      element={<ProjectList />}
    />

    <Route
      path="/projects/create"
      element={<CreateProject />}
    />

    <Route
      path="/projects/:projectId"
      element={<ProjectDetail />}
    />

    {/* Reports */}
    <Route
      path="/reports"
      element={<ReportBuilder />}
    />

    <Route
      path="/reports/preview"
      element={<ReportPreview />}
    />

    <Route
      path="/reports/export"
      element={<PDFExport />}
    />

    <Route
  path="/projects/:projectId/inventory"
  element={<Inventory />}
/>

<Route
  path="/projects/:projectId/finance"
  element={<Finance />}
/>

<Route
  path="/projects/:projectId/employees"
  element={<Employees />}
/>

<Route
  path="/projects/:projectId/chat"
  element={<ProjectChat />}
/>

<Route
  path="/edit-org"
  element={<EditOrganization />}
/>
  </Routes>
)
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OrgProvider>
          <Toaster />
          <AppRoutes />
        </OrgProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
