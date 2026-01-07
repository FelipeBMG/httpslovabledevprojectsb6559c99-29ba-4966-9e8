import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Receipt, 
  TrendingUp, 
  Calendar, 
  ShoppingBag, 
  Dog, 
  Filter,
  ChevronDown,
  CreditCard,
  Banknote,
  Smartphone,
  Star,
  AlertCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, subMonths, startOfMonth, endOfMonth, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientBillingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
}

interface SaleItem {
  id: string;
  sale_id: string;
  description: string;
  item_type: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  covered_by_plan: boolean;
  pet_id: string | null;
  source_id: string | null;
}

interface Sale {
  id: string;
  created_at: string;
  total_amount: number;
  subtotal: number;
  payment_method: string;
  payment_status: string;
  pet_id: string | null;
  notes: string | null;
  items: SaleItem[];
}

interface PetData {
  id: string;
  name: string;
  species: string;
}

interface ClientPlan {
  id: string;
  price_paid: number;
  purchased_at: string;
  pet_id: string;
  plan_name?: string;
}

type PeriodFilter = '30d' | '90d' | '12m' | 'all';

const PAYMENT_METHOD_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  dinheiro: { label: 'Dinheiro', icon: <Banknote className="w-4 h-4" /> },
  pix: { label: 'PIX', icon: <Smartphone className="w-4 h-4" /> },
  credito: { label: 'Crédito', icon: <CreditCard className="w-4 h-4" /> },
  debito: { label: 'Débito', icon: <CreditCard className="w-4 h-4" /> },
};

export function ClientBillingDialog({ open, onOpenChange, clientId, clientName }: ClientBillingDialogProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [pets, setPets] = useState<PetData[]>([]);
  const [clientPlans, setClientPlans] = useState<ClientPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('12m');
  const [selectedPetFilter, setSelectedPetFilter] = useState<string>('all');
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState<string>('all');
  const [expandedSales, setExpandedSales] = useState<Set<string>>(new Set());

  // Fetch all data
  useEffect(() => {
    if (open && clientId) {
      fetchData();
    }
  }, [open, clientId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch pets for this client
      const { data: petsData } = await supabase
        .from('pets')
        .select('id, name, species')
        .eq('client_id', clientId);

      setPets((petsData || []) as PetData[]);

      // Fetch client plans (for plan revenue tracking)
      const { data: plansData } = await supabase
        .from('client_plans')
        .select(`
          id,
          price_paid,
          purchased_at,
          pet_id,
          bath_plans(plan_name)
        `)
        .eq('client_id', clientId);

      const plans = (plansData || []).map((p: any) => ({
        id: p.id,
        price_paid: p.price_paid,
        purchased_at: p.purchased_at,
        pet_id: p.pet_id,
        plan_name: p.bath_plans?.plan_name || 'Plano',
      }));
      setClientPlans(plans);

      // Fetch sales with items
      const { data: salesData } = await supabase
        .from('sales')
        .select(`
          id,
          created_at,
          total_amount,
          subtotal,
          payment_method,
          payment_status,
          pet_id,
          notes,
          sale_items(
            id,
            sale_id,
            description,
            item_type,
            quantity,
            unit_price,
            total_price,
            covered_by_plan,
            pet_id,
            source_id
          )
        `)
        .eq('client_id', clientId)
        .eq('payment_status', 'pago')
        .order('created_at', { ascending: false });

      const salesWithItems = (salesData || []).map((s: any) => ({
        id: s.id,
        created_at: s.created_at,
        total_amount: s.total_amount,
        subtotal: s.subtotal,
        payment_method: s.payment_method,
        payment_status: s.payment_status,
        pet_id: s.pet_id,
        notes: s.notes,
        items: s.sale_items || [],
      }));
      setSales(salesWithItems);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter sales by period
  const getFilteredSales = useMemo(() => {
    let filtered = sales;

    // Period filter
    const now = new Date();
    let startDate: Date | null = null;

    switch (periodFilter) {
      case '30d':
        startDate = subDays(now, 30);
        break;
      case '90d':
        startDate = subDays(now, 90);
        break;
      case '12m':
        startDate = subMonths(now, 12);
        break;
      case 'all':
        startDate = null;
        break;
    }

    if (startDate) {
      filtered = filtered.filter(s => new Date(s.created_at) >= startDate!);
    }

    // Pet filter
    if (selectedPetFilter !== 'all') {
      filtered = filtered.filter(s => 
        s.pet_id === selectedPetFilter ||
        s.items.some(item => item.pet_id === selectedPetFilter)
      );
    }

    // Payment method filter
    if (selectedPaymentFilter !== 'all') {
      filtered = filtered.filter(s => s.payment_method === selectedPaymentFilter);
    }

    return filtered;
  }, [sales, periodFilter, selectedPetFilter, selectedPaymentFilter]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const filtered = getFilteredSales;
    const totalRevenue = filtered.reduce((sum, s) => sum + (s.total_amount || 0), 0);
    const totalPurchases = filtered.length;
    const avgTicket = totalPurchases > 0 ? totalRevenue / totalPurchases : 0;

    // First and last purchase dates
    const allSales = sales.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const firstPurchase = allSales.length > 0 ? allSales[0].created_at : null;
    const lastPurchase = allSales.length > 0 ? allSales[allSales.length - 1].created_at : null;

    // Calculate purchase frequency (average days between purchases)
    let avgFrequency = 0;
    if (allSales.length > 1) {
      const daysBetween = differenceInDays(
        new Date(lastPurchase!),
        new Date(firstPurchase!)
      );
      avgFrequency = Math.round(daysBetween / (allSales.length - 1));
    }

    // Separate revenue by type
    let planRevenue = 0;
    let additionalRevenue = 0;
    let regularRevenue = 0;

    filtered.forEach(sale => {
      sale.items.forEach(item => {
        if (item.covered_by_plan) {
          // Items covered by plan don't count as revenue (already paid in plan)
          return;
        }
        if (item.item_type === 'plano' || item.description?.toLowerCase().includes('plano')) {
          planRevenue += item.total_price;
        } else if (item.item_type === 'adicional' || item.description?.toLowerCase().includes('adicional')) {
          additionalRevenue += item.total_price;
        } else {
          regularRevenue += item.total_price;
        }
      });
    });

    // Add plan purchases
    clientPlans.forEach(plan => {
      const purchaseDate = new Date(plan.purchased_at);
      let shouldInclude = true;
      
      if (periodFilter === '30d') {
        shouldInclude = purchaseDate >= subDays(new Date(), 30);
      } else if (periodFilter === '90d') {
        shouldInclude = purchaseDate >= subDays(new Date(), 90);
      } else if (periodFilter === '12m') {
        shouldInclude = purchaseDate >= subMonths(new Date(), 12);
      }

      if (shouldInclude && (selectedPetFilter === 'all' || plan.pet_id === selectedPetFilter)) {
        planRevenue += plan.price_paid;
      }
    });

    return {
      totalRevenue: totalRevenue + clientPlans.reduce((sum, p) => sum + p.price_paid, 0),
      totalPurchases,
      avgTicket,
      firstPurchase,
      lastPurchase,
      avgFrequency,
      planRevenue,
      additionalRevenue,
      regularRevenue,
    };
  }, [getFilteredSales, clientPlans, sales, periodFilter, selectedPetFilter]);

  // Revenue by pet
  const revenueByPet = useMemo(() => {
    const petStats: Record<string, {
      name: string;
      totalRevenue: number;
      totalServices: number;
      services: Record<string, number>;
    }> = {};

    // Initialize all pets
    pets.forEach(pet => {
      petStats[pet.id] = {
        name: pet.name,
        totalRevenue: 0,
        totalServices: 0,
        services: {},
      };
    });

    // Add revenue from sales
    getFilteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const petId = item.pet_id || sale.pet_id;
        if (petId && petStats[petId]) {
          if (!item.covered_by_plan) {
            petStats[petId].totalRevenue += item.total_price;
          }
          petStats[petId].totalServices += 1;
          const serviceName = item.description || 'Outro';
          petStats[petId].services[serviceName] = (petStats[petId].services[serviceName] || 0) + 1;
        }
      });
    });

    // Add plan revenue
    clientPlans.forEach(plan => {
      if (petStats[plan.pet_id]) {
        petStats[plan.pet_id].totalRevenue += plan.price_paid;
        petStats[plan.pet_id].totalServices += 1;
        petStats[plan.pet_id].services[plan.plan_name || 'Plano'] = 
          (petStats[plan.pet_id].services[plan.plan_name || 'Plano'] || 0) + 1;
      }
    });

    return Object.entries(petStats).map(([id, data]) => ({
      id,
      ...data,
      avgTicket: data.totalServices > 0 ? data.totalRevenue / data.totalServices : 0,
      topServices: Object.entries(data.services)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name]) => name),
    }));
  }, [getFilteredSales, pets, clientPlans]);

  // Revenue by month
  const revenueByMonth = useMemo(() => {
    const monthStats: Record<string, number> = {};
    
    getFilteredSales.forEach(sale => {
      const monthKey = format(new Date(sale.created_at), 'yyyy-MM');
      monthStats[monthKey] = (monthStats[monthKey] || 0) + sale.total_amount;
    });

    // Add plan purchases
    clientPlans.forEach(plan => {
      const monthKey = format(new Date(plan.purchased_at), 'yyyy-MM');
      monthStats[monthKey] = (monthStats[monthKey] || 0) + plan.price_paid;
    });

    return Object.entries(monthStats)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, revenue]) => ({
        month,
        monthLabel: format(parseISO(month + '-01'), 'MMM/yy', { locale: ptBR }),
        revenue,
      }));
  }, [getFilteredSales, clientPlans]);

  // Client tier based on revenue
  const clientTier = useMemo(() => {
    const total = summary.totalRevenue;
    if (total >= 5000) return { label: 'Alto Faturamento', color: 'bg-green-500', icon: '🟢' };
    if (total >= 1000) return { label: 'Médio', color: 'bg-yellow-500', icon: '🟡' };
    if (total > 0) return { label: 'Baixo Faturamento', color: 'bg-red-500', icon: '🔴' };
    return { label: 'Sem Compras', color: 'bg-gray-500', icon: '⚪' };
  }, [summary.totalRevenue]);

  // Days since last purchase
  const daysSinceLastPurchase = useMemo(() => {
    if (!summary.lastPurchase) return null;
    return differenceInDays(new Date(), new Date(summary.lastPurchase));
  }, [summary.lastPurchase]);

  const toggleSaleExpanded = (saleId: string) => {
    const newExpanded = new Set(expandedSales);
    if (newExpanded.has(saleId)) {
      newExpanded.delete(saleId);
    } else {
      newExpanded.add(saleId);
    }
    setExpandedSales(newExpanded);
  };

  const getPetName = (petId: string | null) => {
    if (!petId) return '-';
    const pet = pets.find(p => p.id === petId);
    return pet?.name || '-';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-primary" />
            Histórico & Faturamento - {clientName}
            <Badge className={`${clientTier.color} text-white ml-2`}>
              {clientTier.icon} {clientTier.label}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <Tabs defaultValue="resumo" className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="resumo">📊 Resumo</TabsTrigger>
              <TabsTrigger value="periodo">📅 Por Período</TabsTrigger>
              <TabsTrigger value="pets">🐾 Por Pet</TabsTrigger>
              <TabsTrigger value="compras">🧾 Compras</TabsTrigger>
            </TabsList>

            {/* Filters - Visible on all tabs */}
            <div className="flex flex-wrap gap-3 mt-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filtros:</span>
              </div>
              <Select value={periodFilter} onValueChange={(v: PeriodFilter) => setPeriodFilter(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="90d">Últimos 90 dias</SelectItem>
                  <SelectItem value="12m">Últimos 12 meses</SelectItem>
                  <SelectItem value="all">Todo período</SelectItem>
                </SelectContent>
              </Select>
              {pets.length > 1 && (
                <Select value={selectedPetFilter} onValueChange={setSelectedPetFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Todos os pets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os pets</SelectItem>
                    {pets.map(pet => (
                      <SelectItem key={pet.id} value={pet.id}>
                        {pet.species === 'cachorro' ? '🐕' : '🐈'} {pet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select value={selectedPaymentFilter} onValueChange={setSelectedPaymentFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="credito">Crédito</SelectItem>
                  <SelectItem value="debito">Débito</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tab: Resumo Financeiro */}
            <TabsContent value="resumo" className="mt-4 space-y-4">
              {/* Main KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-soft">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(summary.totalRevenue)}
                        </p>
                        <p className="text-xs text-muted-foreground">Faturamento Total</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-soft">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                        <Receipt className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{summary.totalPurchases}</p>
                        <p className="text-xs text-muted-foreground">Total de Compras</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-soft">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-purple-600">
                          {formatCurrency(summary.avgTicket)}
                        </p>
                        <p className="text-xs text-muted-foreground">Ticket Médio</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-soft">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-orange-600">
                          {summary.avgFrequency > 0 ? `${summary.avgFrequency} dias` : '-'}
                        </p>
                        <p className="text-xs text-muted-foreground">Frequência Média</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Date and inactivity info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-0 shadow-soft">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Datas
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Primeira compra:</span>
                        <span className="font-medium">
                          {summary.firstPurchase 
                            ? format(new Date(summary.firstPurchase), "dd/MM/yyyy", { locale: ptBR })
                            : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Última compra:</span>
                        <span className="font-medium">
                          {summary.lastPurchase 
                            ? format(new Date(summary.lastPurchase), "dd/MM/yyyy", { locale: ptBR })
                            : '-'}
                        </span>
                      </div>
                      {daysSinceLastPurchase !== null && daysSinceLastPurchase > 60 && (
                        <div className="flex items-center gap-2 mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <AlertCircle className="w-4 h-4 text-yellow-600" />
                          <span className="text-yellow-700 dark:text-yellow-400 text-sm">
                            Inativo há {daysSinceLastPurchase} dias
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-soft">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4" />
                      Faturamento por Tipo
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          Planos
                        </span>
                        <span className="font-medium">{formatCurrency(summary.planRevenue)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          Adicionais (em plano)
                        </span>
                        <span className="font-medium">{formatCurrency(summary.additionalRevenue)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          Avulsos
                        </span>
                        <span className="font-medium">{formatCurrency(summary.regularRevenue)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab: Por Período */}
            <TabsContent value="periodo" className="mt-4">
              <Card className="border-0 shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg">Faturamento Mensal</CardTitle>
                </CardHeader>
                <CardContent>
                  {revenueByMonth.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhuma venda no período selecionado
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {revenueByMonth.map((item, index) => {
                        const maxRevenue = Math.max(...revenueByMonth.map(r => r.revenue));
                        const width = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                        
                        return (
                          <motion.div
                            key={item.month}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center gap-3"
                          >
                            <span className="w-16 text-sm text-muted-foreground">{item.monthLabel}</span>
                            <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${width}%` }}
                                transition={{ delay: index * 0.05, duration: 0.5 }}
                                className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full flex items-center justify-end pr-2"
                              >
                                {width > 30 && (
                                  <span className="text-xs text-white font-medium">
                                    {formatCurrency(item.revenue)}
                                  </span>
                                )}
                              </motion.div>
                            </div>
                            {width <= 30 && (
                              <span className="text-sm font-medium w-24 text-right">
                                {formatCurrency(item.revenue)}
                              </span>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Por Pet */}
            <TabsContent value="pets" className="mt-4">
              {pets.length === 0 ? (
                <Card className="border-0 shadow-soft">
                  <CardContent className="p-8 text-center">
                    <Dog className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Nenhum pet cadastrado</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {revenueByPet.map((pet) => (
                    <Card key={pet.id} className="border-0 shadow-soft">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">
                              {pets.find(p => p.id === pet.id)?.species === 'cachorro' ? '🐕' : '🐈'}
                            </span>
                            <h4 className="font-semibold text-lg">{pet.name}</h4>
                          </div>
                          <Badge variant="secondary">
                            {pet.totalServices} serviços
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total faturado:</span>
                            <span className="font-bold text-green-600">
                              {formatCurrency(pet.totalRevenue)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Ticket médio:</span>
                            <span className="font-medium">
                              {formatCurrency(pet.avgTicket)}
                            </span>
                          </div>
                          {pet.topServices.length > 0 && (
                            <div>
                              <span className="text-xs text-muted-foreground">Serviços mais consumidos:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {pet.topServices.map((service, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {service}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tab: Detalhamento de Compras */}
            <TabsContent value="compras" className="mt-4">
              <Card className="border-0 shadow-soft">
                <CardContent className="p-0">
                  {getFilteredSales.length === 0 ? (
                    <div className="p-8 text-center">
                      <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Nenhuma compra no período</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {getFilteredSales.map((sale) => (
                        <Collapsible
                          key={sale.id}
                          open={expandedSales.has(sale.id)}
                          onOpenChange={() => toggleSaleExpanded(sale.id)}
                        >
                          <CollapsibleTrigger asChild>
                            <div className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <Receipt className="w-5 h-5 text-primary" />
                                  </div>
                                  <div>
                                    <p className="font-medium">
                                      {format(new Date(sale.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      {sale.pet_id && (
                                        <Badge variant="outline" className="text-xs">
                                          🐾 {getPetName(sale.pet_id)}
                                        </Badge>
                                      )}
                                      <span className="flex items-center gap-1">
                                        {PAYMENT_METHOD_LABELS[sale.payment_method]?.icon}
                                        {PAYMENT_METHOD_LABELS[sale.payment_method]?.label || sale.payment_method}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-lg">
                                    {formatCurrency(sale.total_amount)}
                                  </span>
                                  <ChevronDown 
                                    className={`w-5 h-5 transition-transform ${
                                      expandedSales.has(sale.id) ? 'rotate-180' : ''
                                    }`}
                                  />
                                </div>
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="px-4 pb-4">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Pet</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead className="text-right">Qtd</TableHead>
                                    <TableHead className="text-right">Valor</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {sale.items.map((item) => (
                                    <TableRow key={item.id}>
                                      <TableCell>
                                        {item.description}
                                        {item.covered_by_plan && (
                                          <Badge variant="secondary" className="ml-2 text-xs">
                                            Plano
                                          </Badge>
                                        )}
                                      </TableCell>
                                      <TableCell>{getPetName(item.pet_id)}</TableCell>
                                      <TableCell>
                                        <Badge variant="outline" className="text-xs">
                                          {item.item_type === 'servico' ? 'Serviço' :
                                           item.item_type === 'produto' ? 'Produto' :
                                           item.item_type === 'adicional' ? 'Adicional' :
                                           item.item_type === 'plano' ? 'Plano' : item.item_type}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right">{item.quantity}</TableCell>
                                      <TableCell className="text-right font-medium">
                                        {item.covered_by_plan ? (
                                          <span className="text-muted-foreground">R$ 0,00</span>
                                        ) : (
                                          formatCurrency(item.total_price)
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
