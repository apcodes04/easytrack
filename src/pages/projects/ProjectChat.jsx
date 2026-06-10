import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageCircle } from 'lucide-react'

export default function ProjectChat() {
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
          <MessageCircle className="text-purple-500" />
          <h1 className="text-2xl font-bold text-gray-900">Group Chat</h1>
        </div>

        <p className="text-gray-600">
          Project communication area.
        </p>
      </div>
    </div>
  )
}