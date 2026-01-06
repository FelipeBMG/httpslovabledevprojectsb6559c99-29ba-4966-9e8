import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { DollarSign, Plus, CreditCard, Banknote, Smartphone, Check, Gift, Trash2, Scissors, Hotel, Package, AlertCircle, Clock, User, ShoppingCart, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useModules } from '@/contexts/ModulesContext';
import { useCashRegister } from '@/hooks/useCashRegister';
import { usePDVData } from '@/hooks/usePDVData';
import { CashRegisterPanel } from '@/components/pdv/CashRegisterPanel';
import { ProductCatalog } from '@/components/pdv/ProductCatalog';
import { Cart } from '@/components/pdv/Cart';
import { CartItem, PaymentMethod, paymentMethodLabels } from '@/components/pdv/types';

const paymentMethods: { value: PaymentMethod; label: string; icon: typeof DollarSign }[] = [
  { value: 'dinheiro', label: 'Dinheiro', icon: Banknote },
  { value: 'pix', label: 'PIX', icon: Smartphone },
  { value: 'credito', label: 'Crédito', icon: CreditCard },
  { value: 'debito', label: 'Débito', icon: CreditCard },
];

const FrenteCaixa = () => {
  const { toast } = useToast();
  const { hasModule } = useModules();
  const [searchParams] = useSearchParams();
  
  // Hooks
  const cashRegister = useCashRegister();
  const pdvData = usePDVData();
  
  // Check modules
  const hasCaixaModule = hasModule('mod_caixa');
  const hasProdutosModule = hasModule('mod_produtos');
  const hasComissaoModule = hasModule('mod_comissao');

  // State
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedPetId, setSelectedPetId] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('pix');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('servicos');
  
  // Extra item form
  const [extraDescription, setExtraDescription] = useState('');
  const [extraPrice, setExtraPrice] = useState('');

  // Filtered pets based on selected client
  const filteredPets = selectedClient ? pdvData.getPetsForClient(selectedClient) : [];
  const selectedPet = pdvData.pets.find(p => p.id === selectedPetId);
  const activePlan = selectedClient && selectedPetId ? pdvData.getActivePlanForPet(selectedClient, selectedPetId) : null;
  const remainingCredits = activePlan ? activePlan.total_baths - activePlan.used_baths : 0;

  // Auto-load from URL params
  useEffect(() => {
    const clientId = searchParams.get('clientId');
    const petId = searchParams.get('petId');
    if (clientId) setSelectedClient(clientId);
    if (petId) setSelectedPetId(petId);
  }, [searchParams, pdvData.clients]);

  // Load pending services when pet is selected
  useEffect(() => {
    if (selectedClient && selectedPetId) {
      pdvData.getPendingServicesForPet(selectedClient, selectedPetId).then(services => {
        setCartItems(prev => {
          const nonServices = prev.filter(item => item.type === 'product' || item.type === 'extra');
          return [...services, ...nonServices];
        });
      });
    } else {
      setCartItems(prev => prev.filter(item => item.type === 'product' || item.type === 'extra'));
    }
  }, [selectedClient, selectedPetId]);

  // Cart operations
  const addToCart = useCallback((item: CartItem) => {
    setCartItems(prev => [...prev, item]);
    toast({ title: 'Item adicionado', description: item.description });
  }, [toast]);

  const removeFromCart = useCallback((id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const total = item.unit_price * quantity - item.discount_amount;
      return { ...item, quantity, total_price: Math.max(0, total) };
    }));
  }, []);

  const applyDiscount = useCallback((id: string, discount: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const maxDiscount = item.unit_price * item.quantity;
      const validDiscount = Math.min(Math.max(0, discount), maxDiscount);
      return { ...item, discount_amount: validDiscount, total_price: item.unit_price * item.quantity - validDiscount };
    }));
  }, []);

  const addExtraItem = () => {
    if (!extraDescription.trim() || !extraPrice) {
      toast({ title: 'Preencha descrição e valor', variant: 'destructive' });
      return;
    }
    const price = parseFloat(extraPrice.replace(',', '.'));
    if (isNaN(price) || price <= 0) {
      toast({ title: 'Valor inválido', variant: 'destructive' });
      return;
    }
    addToCart({
      id: `extra_${Date.now()}`,
      type: 'extra',
      description: extraDescription,
      quantity: 1,
      unit_price: price,
      discount_amount: 0,
      total_price: price,
      covered_by_plan: false,
      commission_rate: 0,
    });
    setExtraDescription('');
    setExtraPrice('');
  };

  // Calculate totals
  const subtotal = cartItems.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);
  const totalDiscount = cartItems.reduce((acc, item) => acc + item.discount_amount, 0);
  const planDiscount = cartItems.filter(i => i.covered_by_plan).reduce((acc, i) => acc + i.unit_price * i.quantity, 0);
  const totalToPay = subtotal - totalDiscount - planDiscount;

  // Finalize sale
  const handleFinalizeSale = async () => {
    if (cartItems.length === 0) {
      toast({ title: 'Carrinho vazio', variant: 'destructive' });
      return;
    }

    // Check if cash is open (if module enabled)
    if (hasCaixaModule && !cashRegister.currentCash) {
      toast({ title: 'Caixa não está aberto', description: 'Abra o caixa antes de registrar vendas.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    const now = new Date().toISOString();

    try {
      // 1. Create sale record
      const { data: sale, error: saleError } = await (supabase as any)
        .from('sales')
        .insert({
          cash_register_id: cashRegister.currentCash?.id,
          client_id: selectedClient || null,
          pet_id: selectedPetId || null,
          employee_id: selectedEmployee || null,
          subtotal,
          discount_amount: totalDiscount + planDiscount,
          total_amount: totalToPay,
          payment_method: selectedPayment,
          payment_status: 'pago',
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // 2. Create sale items
      for (const item of cartItems) {
        await (supabase as any).from('sale_items').insert({
          sale_id: sale.id,
          product_id: item.product_id,
          item_type: item.type,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_amount: item.discount_amount,
          total_price: item.covered_by_plan ? 0 : item.total_price,
          covered_by_plan: item.covered_by_plan,
          source_id: item.source_id,
          pet_id: item.pet_id,
          commission_rate: item.commission_rate,
        });

        // Update service payment status
        if (item.type === 'service_banho' && item.source_id) {
          await supabase.from('bath_grooming_appointments').update({
            status: 'finalizado',
            payment_status: item.covered_by_plan ? 'isento' : 'pago',
            payment_method: selectedPayment,
            paid_at: now,
          } as any).eq('id', item.source_id);
        } else if (item.type === 'service_hotel' && item.source_id) {
          await supabase.from('hotel_stays').update({
            status: 'check_out',
            payment_status: 'pago',
            payment_method: selectedPayment,
            paid_at: now,
          } as any).eq('id', item.source_id);
        } else if (item.type === 'product' && item.product_id) {
          // Update stock
          await (supabase as any).rpc('', {}).catch(() => {});
          const { data: prod } = await (supabase as any).from('products').select('stock_quantity').eq('id', item.product_id).single();
          if (prod) {
            await (supabase as any).from('products').update({ stock_quantity: Math.max(0, prod.stock_quantity - item.quantity) }).eq('id', item.product_id);
          }
        }

        // Create commission if enabled
        if (hasComissaoModule && selectedEmployee && item.commission_rate > 0 && !item.covered_by_plan) {
          const commissionAmount = item.total_price * (item.commission_rate / 100);
          await (supabase as any).from('commissions').insert({
            employee_id: selectedEmployee,
            sale_id: sale.id,
            amount: commissionAmount,
            rate: item.commission_rate,
            status: 'pendente',
          });
        }
      }

      // Update client last_purchase
      if (selectedClient) {
        await supabase.from('clients').update({ last_purchase: now }).eq('id', selectedClient);
      }

      toast({ title: '✅ Venda registrada!', description: `Total: R$ ${totalToPay.toFixed(2)}` });

      // Reset
      setCartItems([]);
      setSelectedClient('');
      setSelectedPetId('');
      cashRegister.refresh();
      pdvData.refresh();

    } catch (error) {
      console.error('Sale error:', error);
      toast({ title: 'Erro ao registrar venda', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-primary" />
              PDV - Ponto de Venda
            </h1>
            <p className="text-muted-foreground mt-1">Vendas unificadas: Produtos + Serviços</p>
          </div>
          {hasCaixaModule && !cashRegister.currentCash && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Lock className="w-4 h-4" />
              Caixa Fechado
            </Badge>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Selection + Products */}
        <div className="lg:col-span-5 space-y-6">
          {/* Client/Pet/Employee Selection */}
          <Card className="border-0 shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Identificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Cliente</Label>
                  <Select value={selectedClient} onValueChange={v => { setSelectedClient(v); setSelectedPetId(''); }}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {pdvData.clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Pet</Label>
                  <Select value={selectedPetId} onValueChange={setSelectedPetId} disabled={!selectedClient}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {filteredPets.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {hasComissaoModule && (
                <div>
                  <Label className="text-xs">Vendedor</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger><SelectValue placeholder="Selecione vendedor (opcional)" /></SelectTrigger>
                    <SelectContent>
                      {pdvData.employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {activePlan && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <Gift className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800 text-sm">{selectedPet?.name} tem plano ativo</p>
                    <p className="text-xs text-green-600">{remainingCredits} crédito(s) disponível(is)</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Products/Services Tabs */}
          <Card className="border-0 shadow-soft">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <CardHeader className="pb-2">
                <TabsList className="w-full">
                  <TabsTrigger value="servicos" className="flex-1">Serviços</TabsTrigger>
                  {hasProdutosModule && <TabsTrigger value="produtos" className="flex-1">Produtos</TabsTrigger>}
                  <TabsTrigger value="extra" className="flex-1">Avulso</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent>
                <TabsContent value="servicos" className="mt-0">
                  <div className="text-center py-6 text-muted-foreground">
                    <Scissors className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Selecione um cliente e pet para carregar serviços pendentes automaticamente.</p>
                  </div>
                </TabsContent>
                {hasProdutosModule && (
                  <TabsContent value="produtos" className="mt-0">
                    <ProductCatalog products={pdvData.products} onAddToCart={addToCart} />
                  </TabsContent>
                )}
                <TabsContent value="extra" className="mt-0 space-y-4">
                  <div className="space-y-3">
                    <Input placeholder="Descrição" value={extraDescription} onChange={e => setExtraDescription(e.target.value)} />
                    <div className="flex gap-2">
                      <Input placeholder="Valor (R$)" value={extraPrice} onChange={e => setExtraPrice(e.target.value)} />
                      <Button onClick={addExtraItem}><Plus className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        {/* Middle: Cart */}
        <div className="lg:col-span-4">
          <Card className="border-0 shadow-soft h-full flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-base">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  Carrinho
                </span>
                <Badge variant="outline">{cartItems.length} itens</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <Cart items={cartItems} onRemoveItem={removeFromCart} onUpdateQuantity={updateQuantity} onApplyDiscount={applyDiscount} />

              <div className="pt-4 mt-4 border-t space-y-2">
                <div className="flex justify-between text-sm"><span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
                {(totalDiscount + planDiscount) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Descontos</span><span>- R$ {(totalDiscount + planDiscount).toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span><span className="text-primary">R$ {totalToPay.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Payment + Cash */}
        <div className="lg:col-span-3 space-y-6">
          {/* Payment */}
          <Card className="border-0 shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map(m => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.value}
                      onClick={() => setSelectedPayment(m.value)}
                      className={cn(
                        'p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all',
                        selectedPayment === m.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                      )}
                    >
                      <Icon className={cn('w-5 h-5', selectedPayment === m.value ? 'text-primary' : 'text-muted-foreground')} />
                      <span className={cn('text-xs font-medium', selectedPayment === m.value ? 'text-primary' : 'text-muted-foreground')}>{m.label}</span>
                    </button>
                  );
                })}
              </div>

              <Button
                className="w-full h-14 text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                onClick={handleFinalizeSale}
                disabled={isLoading || cartItems.length === 0 || (hasCaixaModule && !cashRegister.currentCash)}
              >
                <Check className="w-5 h-5 mr-2" />
                {isLoading ? 'Registrando...' : `Finalizar R$ ${totalToPay.toFixed(2)}`}
              </Button>
            </CardContent>
          </Card>

          {/* Cash Register */}
          {hasCaixaModule && (
            <CashRegisterPanel
              currentCash={cashRegister.currentCash}
              movements={cashRegister.movements}
              currentBalance={cashRegister.currentBalance}
              totalSalesToday={cashRegister.totalSalesToday}
              onOpenCash={cashRegister.openCash}
              onCloseCash={cashRegister.closeCash}
              onAddMovement={cashRegister.addMovement}
            />
          )}

          {/* Today's Total */}
          <Card className="border-0 shadow-soft bg-gradient-to-br from-primary to-primary/80 text-white">
            <CardContent className="p-6">
              <p className="text-white/80 text-sm">Total de Hoje</p>
              <p className="text-3xl font-bold">R$ {cashRegister.totalSalesToday.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FrenteCaixa;
