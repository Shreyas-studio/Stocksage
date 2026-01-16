import StockCard from '../StockCard'

export default function StockCardExample() {
  return (
    <div className="p-6 space-y-4">
      <StockCard 
        symbol="TCS.NS"
        quantity={10}
        buyPrice={3500}
        currentPrice={3700}
        aiAction="Sell"
        aiReason="RSI 72, short-term overbought"
        targetPrice={3720}
        onEdit={() => console.log('Edit TCS')}
        onDelete={() => console.log('Delete TCS')}
      />
      <StockCard 
        symbol="INFY.NS"
        quantity={20}
        buyPrice={1450}
        currentPrice={1505}
        aiAction="Hold"
        aiReason="Neutral trend, consolidating"
        targetPrice={1620}
        onEdit={() => console.log('Edit INFY')}
        onDelete={() => console.log('Delete INFY')}
      />
    </div>
  )
}
