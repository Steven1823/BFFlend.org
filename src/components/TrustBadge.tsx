import React from 'react'
import { Shield } from 'lucide-react'

interface TrustBadgeProps {
  text: string
}

const TrustBadge: React.FC<TrustBadgeProps> = ({ text }) => {
  return (
    <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-full">
      <Shield className="w-4 h-4 text-emerald-600" />
      <span className="text-sm font-medium text-gray-700">{text}</span>
    </div>
  )
}

export default TrustBadge