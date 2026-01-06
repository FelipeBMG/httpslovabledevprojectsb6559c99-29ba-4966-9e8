import { useState, useMemo } from 'react';
import { Search, Package, ShoppingBag, AlertTriangle, Plus, Minus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Product, categoryLabels, CartItem } from './types';
import { cn } from '@/lib/utils';

interface ProductCatalogProps {
  products: Product[];
  onAddToCart: (item: CartItem) => void;
  disabled?: boolean;
}

const categories = ['todos', 'racao', 'medicamento', 'higiene', 'acessorio', 'outros'];

export function ProductCatalog({ products, onAddToCart, disabled }: ProductCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('todos');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by category
    if (activeCategory !== 'todos') {
      filtered = filtered.filter(p => p.category === activeCategory);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(query) ||
          p.barcode?.includes(searchQuery) ||
          p.sku?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [products, activeCategory, searchQuery]);

  const handleAddProduct = (product: Product) => {
    const qty = quantities[product.id] || 1;
    const item: CartItem = {
      id: `prod_${product.id}_${Date.now()}`,
      type: 'product',
      product_id: product.id,
      description: product.name,
      quantity: qty,
      unit_price: product.sale_price,
      discount_amount: 0,
      total_price: product.sale_price * qty,
      covered_by_plan: false,
      commission_rate: product.commission_rate,
    };
    onAddToCart(item);
    setQuantities(prev => ({ ...prev, [product.id]: 1 }));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[productId] || 1;
      const newQty = Math.max(1, current + delta);
      return { ...prev, [productId]: newQty };
    });
  };

  const lowStockProducts = products.filter(p => p.stock_quantity <= p.min_stock_quantity);

  if (disabled) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Low stock alert */}
      {lowStockProducts.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>
            <strong>{lowStockProducts.length}</strong> produto(s) com estoque baixo
          </span>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar produto (nome, código, barcode)"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="w-full flex-wrap h-auto">
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat} className="text-xs">
              {cat === 'todos' ? 'Todos' : categoryLabels[cat] || cat}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Products Grid */}
      <ScrollArea className="h-[400px]">
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map(product => {
            const qty = quantities[product.id] || 1;
            const isLowStock = product.stock_quantity <= product.min_stock_quantity;
            const isOutOfStock = product.stock_quantity <= 0;

            return (
              <div
                key={product.id}
                className={cn(
                  'p-3 rounded-xl border transition-all',
                  isOutOfStock
                    ? 'bg-muted/50 border-muted opacity-60'
                    : isLowStock
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-card border-border hover:border-primary/50'
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {categoryLabels[product.category] || product.category}
                    </p>
                  </div>
                  {isLowStock && (
                    <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 shrink-0">
                      {isOutOfStock ? 'Sem estoque' : `${product.stock_quantity} un`}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-primary">
                    R$ {product.sale_price.toFixed(2)}
                  </p>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-7 h-7"
                      onClick={() => updateQuantity(product.id, -1)}
                      disabled={qty <= 1}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{qty}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-7 h-7"
                      onClick={() => updateQuantity(product.id, 1)}
                      disabled={isOutOfStock || qty >= product.stock_quantity}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button
                      size="icon"
                      className="w-8 h-8 ml-1"
                      onClick={() => handleAddProduct(product)}
                      disabled={isOutOfStock}
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="col-span-2 text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum produto encontrado</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
