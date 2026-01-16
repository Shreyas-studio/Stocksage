import PortfolioHeader from '../PortfolioHeader'

export default function PortfolioHeaderExample() {
  return <PortfolioHeader 
    totalValue={245000} 
    totalProfitLoss={12500} 
    profitLossPercent={5.37}
    userName="Alex Kumar"
    onNotificationClick={() => console.log('Notifications clicked')}
  />
}
