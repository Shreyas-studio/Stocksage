import { useState, useMemo } from "react";
import { Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AddStockDialogProps {
  onAddStock?: (stock: {
    symbol: string;
    quantity: number;
    buyPrice: number;
    targetSellPrice: number;
    targetBuyPrice: number;
  }) => void;
}

export default function AddStockDialog({ onAddStock }: AddStockDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    symbol: '',
    quantity: '',
    buyPrice: '',
    targetSellPrice: '',
    targetBuyPrice: '',
  });

  const symbolValidation = useMemo(() => {
    if (!formData.symbol) return null;
    
    const upperSymbol = formData.symbol.toUpperCase();
    const isIndianStock = upperSymbol.endsWith('.NS') || upperSymbol.endsWith('.BO');
    
    if (!isIndianStock) {
      return {
        type: 'warning' as const,
        message: `For Indian stocks, add .NS (NSE) or .BO (BSE) suffix. Example: ${formData.symbol}.NS`
      };
    }
    
    return null;
  }, [formData.symbol]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddStock?.({
      symbol: formData.symbol,
      quantity: Number(formData.quantity),
      buyPrice: Number(formData.buyPrice),
      targetSellPrice: Number(formData.targetSellPrice),
      targetBuyPrice: Number(formData.targetBuyPrice),
    });
    setFormData({
      symbol: '',
      quantity: '',
      buyPrice: '',
      targetSellPrice: '',
      targetBuyPrice: '',
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" data-testid="button-add-stock">
          <Plus className="h-4 w-4" />
          Add Stock
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-add-stock">
        <DialogHeader>
          <DialogTitle>Add Stock to Portfolio</DialogTitle>
          <DialogDescription>
            Enter the stock details to track it in your portfolio
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="symbol">Stock Symbol</Label>
                <Input
                  id="symbol"
                  placeholder="e.g., RELIANCE.NS or TCS.NS"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                  required
                  data-testid="input-symbol"
                />
                {symbolValidation && (
                  <Alert variant="default" className="mt-2 py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {symbolValidation.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="10"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                  data-testid="input-quantity"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="buyPrice">Buy Price (₹)</Label>
              <Input
                id="buyPrice"
                type="number"
                step="0.01"
                placeholder="3500.00"
                value={formData.buyPrice}
                onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
                required
                data-testid="input-buy-price"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetSellPrice">Target Sell Price (₹)</Label>
                <Input
                  id="targetSellPrice"
                  type="number"
                  step="0.01"
                  placeholder="3800.00"
                  value={formData.targetSellPrice}
                  onChange={(e) => setFormData({ ...formData, targetSellPrice: e.target.value })}
                  data-testid="input-target-sell"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetBuyPrice">Target Buy Price (₹)</Label>
                <Input
                  id="targetBuyPrice"
                  type="number"
                  step="0.01"
                  placeholder="3200.00"
                  value={formData.targetBuyPrice}
                  onChange={(e) => setFormData({ ...formData, targetBuyPrice: e.target.value })}
                  data-testid="input-target-buy"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button type="submit" data-testid="button-submit">Add Stock</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
