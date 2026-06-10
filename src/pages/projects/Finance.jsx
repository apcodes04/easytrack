import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, IndianRupee } from 'lucide-react'

export default function Finance() {
  const { projectId } = useParams()
  const navigate = useNavigate()

  return (
    <div className="max-w-5xl mx-auto p-6">
      <button
        onClick={() => navigate(`/projects/${projectId}`)}
        className="flex items-center gap-2 text-gray-600 hover:text-black mb-6"
      >
        <ArrowLeft size={18} />
        Back to Project
      </button>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-4">
          <IndianRupee className="text-green-500" />
          <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
        </div>

        <p className="text-gray-600">
          Project finance module is ready for development.
        </p>
      </div>
    </div>
  )
}