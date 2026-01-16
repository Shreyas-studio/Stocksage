import AlertItem from '../AlertItem'

export default function AlertItemExample() {
  return (
    <div className="p-6 space-y-3">
      <AlertItem 
        symbol="TCS.NS"
        message="Stock is near ₹3,720 (Sell Target). AI Suggests: Sell 50% for profit booking"
        targetPrice={3720}
        currentPrice={3700}
        type="sell"
        timestamp="5 min ago"
      />
      <AlertItem 
        symbol="HDFC.NS"
        message="Strong uptrend detected. Consider adding to position at current levels"
        targetPrice={1750}
        currentPrice={1600}
        type="buy"
        timestamp="15 min ago"
      />
      <AlertItem 
        symbol="INFY.NS"
        message="AI analysis complete. Recommendation: Hold position"
        targetPrice={1620}
        currentPrice={1505}
        type="info"
        timestamp="20 min ago"
      />
    </div>
  )
}
