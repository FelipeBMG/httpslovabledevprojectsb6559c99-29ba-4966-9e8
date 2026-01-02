import { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Plus, Receipt, CreditCard, Banknote, Smartphone, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockClients, mockSales, mockPets } from '@/data/mockData';
import { Sale, PaymentMethod, SaleType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const paymentMethods: { value: PaymentMethod; label: string; icon: typeof DollarSign }[] = [
  { value: 'dinheiro', label: 'Dinheiro', icon: Banknote },
  { value: 'pix', label: 'PIX', icon: Smartphone },
  { value: 'credito', label: 'Crédito', icon: CreditCard },
  { value: 'debito', label: 'Débito', icon: CreditCard },
];

const saleTypes: { value: SaleType; label: string }[] = [
  { value: 'banho', label: 'Banho' },
  { value: 'hotelzinho', label: 'Hotelzinho' },
  { value: 'plano', label: 'Plano' },
  { value: 'adicional', label: 'Adicional' },
];

const FrenteCaixa = () => {
  const { toast } = useToast();
  const [sales] = useState<Sale[]>(mockSales);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedType, setSelectedType] = useState<SaleType>('banho');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('pix');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [issueNF, setIssueNF] = useState(false);

  const todaySales = sales.filter(s => 
    new Date(s.createdAt).toDateString() === new Date().toDateString()
  );
  const todayTotal = todaySales.reduce((acc, s) => acc + s.amount, 0);

  const handleRegisterSale = () => {
    if (!selectedClient || !amount) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha cliente e valor para registrar a venda.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "✅ Venda Registrada!",
      description: `Webhook disparado para o n8n. ${issueNF ? 'NF-e será preparada.' : ''}`,
    });

    // Reset form
    setSelectedClient('');
    setAmount('');
    setDescription('');
    setIssueNF(false);
  };

  const getClient = (clientId: string) => mockClients.find(c => c.id === clientId);

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-primary" />
              Frente de Caixa
            </h1>
            <p className="text-muted-foreground mt-1">
              Registre vendas de serviços e produtos
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* New Sale Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Nova Venda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Client Selection */}
              <div>
                <Label>Cliente</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockClients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} - {client.whatsapp}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sale Type */}
              <div>
                <Label>Tipo de Venda</Label>
                <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as SaleType)}>
                  <TabsList className="grid grid-cols-4 w-full">
                    {saleTypes.map(type => (
                      <TabsTrigger key={type.value} value={type.value}>
                        {type.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              {/* Description */}
              <div>
                <Label>Descrição</Label>
                <Input 
                  placeholder="Ex: Banho + Tosa - Thor"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Amount */}
              <div>
                <Label>Valor (R$)</Label>
                <Input 
                  type="number"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-2xl font-bold"
                />
              </div>

              {/* Payment Method */}
              <div>
                <Label>Forma de Pagamento</Label>
                <div className="grid grid-cols-4 gap-3 mt-2">
                  {paymentMethods.map(method => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.value}
                        onClick={() => setSelectedPayment(method.value)}
                        className={cn(
                          "p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all",
                          selectedPayment === method.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        )}
                      >
                        <Icon className={cn(
                          "w-6 h-6",
                          selectedPayment === method.value ? "text-primary" : "text-muted-foreground"
                        )} />
                        <span className={cn(
                          "text-sm font-medium",
                          selectedPayment === method.value ? "text-primary" : "text-muted-foreground"
                        )}>
                          {method.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* NF-e Toggle */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                <div className="flex items-center gap-3">
                  <Receipt className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Emitir NF-e</p>
                    <p className="text-sm text-muted-foreground">
                      Preparar dados para nota fiscal
                    </p>
                  </div>
                </div>
                <Switch checked={issueNF} onCheckedChange={setIssueNF} />
              </div>

              {/* Submit Button */}
              <Button 
                className="w-full h-14 text-lg bg-gradient-success hover:opacity-90"
                onClick={handleRegisterSale}
              >
                <Check className="w-5 h-5 mr-2" />
                Registrar Venda
                {amount && ` - R$ ${parseFloat(amount).toFixed(2)}`}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Today's Summary */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Today's Total */}
          <Card className="border-0 shadow-soft bg-gradient-primary text-white">
            <CardContent className="p-6">
              <p className="text-white/80 text-sm">Total de Hoje</p>
              <p className="text-4xl font-display font-bold mt-2">
                R$ {todayTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-white/60 text-sm mt-2">
                {todaySales.length} venda{todaySales.length !== 1 ? 's' : ''} realizada{todaySales.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          {/* Recent Sales */}
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Vendas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sales.slice(0, 5).map((sale, index) => {
                  const client = getClient(sale.clientId);
                  return (
                    <motion.div
                      key={sale.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">{sale.description}</p>
                        <p className="text-xs text-muted-foreground">{client?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">
                          R$ {sale.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {sale.paymentMethod}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default FrenteCaixa;
