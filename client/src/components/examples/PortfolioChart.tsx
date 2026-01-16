import PortfolioChart from '../PortfolioChart'

export default function PortfolioChartExample() {
  const mockData = [
    { date: 'Jan 1', value: 220000 },
    { date: 'Jan 5', value: 225000 },
    { date: 'Jan 10', value: 230000 },
    { date: 'Jan 15', value: 228000 },
    { date: 'Jan 20', value: 235000 },
    { date: 'Jan 25', value: 240000 },
    { date: 'Jan 30', value: 245000 },
  ];

  return (
    <div className="p-6">
      <PortfolioChart data={mockData} />
    </div>
  )
}
