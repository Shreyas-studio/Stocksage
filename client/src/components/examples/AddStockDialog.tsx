import AddStockDialog from '../AddStockDialog'

export default function AddStockDialogExample() {
  return (
    <div className="p-6">
      <AddStockDialog 
        onAddStock={(stock) => console.log('Add stock:', stock)}
      />
    </div>
  )
}
