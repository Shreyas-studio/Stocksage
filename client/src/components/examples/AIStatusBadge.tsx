import { useState } from 'react'
import AIStatusBadge from '../AIStatusBadge'

export default function AIStatusBadgeExample() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  return (
    <div className="p-6 space-y-4">
      <AIStatusBadge 
        isAnalyzing={isAnalyzing}
        lastAnalyzed="5 min ago"
        nextCheck="in 3 min"
        onRefresh={() => {
          console.log('Refresh clicked');
          setIsAnalyzing(true);
          setTimeout(() => setIsAnalyzing(false), 2000);
        }}
      />
    </div>
  )
}
