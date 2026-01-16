import SummaryCard from '../SummaryCard'
import { Wallet, TrendingUp, Bell } from 'lucide-react'

export default function SummaryCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
      <SummaryCard 
        title="Total Value"
        value="₹2,45,000"
        icon={Wallet}
      />
      <SummaryCard 
        title="Total P/L"
        value="+₹12,500"
        subtitle="+5.37%"
        icon={TrendingUp}
        trend="up"
      />
      <SummaryCard 
        title="Active Alerts"
        value="3"
        subtitle="2 near target"
        icon={Bell}
      />
    </div>
  )
}
