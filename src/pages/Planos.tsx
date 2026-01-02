import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Plus, Sparkles, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { mockPlans, mockClients } from '@/data/mockData';
import { Plan, PlanType } from '@/types';
import { cn } from '@/lib/utils';

const planConfig: Record<PlanType, { name: string; baths: number; price: number; color: string }> = {
  avulso: { name: 'Avulso', baths: 1, price: 70, color: 'bg-muted' },
  plano_4: { name: 'Plano 4 Banhos', baths: 4, price: 220, color: 'bg-primary' },
  plano_8: { name: 'Plano 8 Banhos', baths: 8, price: 400, color: 'bg-gradient-primary' },
};

const Planos = () => {
  const [plans, setPlans] = useState<Plan[]>(mockPlans);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);

  const getClient = (clientId: string) => mockClients.find(c => c.id === clientId);

  const isExpired = (date: Date) => new Date(date) < new Date();
  const isNearExpiry = (date: Date) => {
    const diff = new Date(date).getTime() - new Date().getTime();
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000; // 7 days
  };

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
              <CreditCard className="w-8 h-8 text-primary" />
              Planos
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os planos de banho & tosa
            </p>
          </div>
          <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                Novo Plano
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Vender Novo Plano</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Cliente</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockClients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo de Plano</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o plano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plano_4">
                        Plano 4 Banhos - R$ 220,00
                      </SelectItem>
                      <SelectItem value="plano_8">
                        Plano 8 Banhos - R$ 400,00
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full bg-gradient-primary hover:opacity-90">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Vender Plano
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Plan Type Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
      >
        {Object.entries(planConfig).map(([key, config], index) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.1 }}
          >
            <Card className={cn(
              "border-0 shadow-soft overflow-hidden",
              key === 'plano_8' && "ring-2 ring-primary"
            )}>
              {key === 'plano_8' && (
                <div className="bg-gradient-primary text-white text-center py-1 text-xs font-bold">
                  MAIS POPULAR
                </div>
              )}
              <CardContent className="p-6">
                <h3 className="font-display font-bold text-xl mb-2">{config.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-primary">
                    R$ {config.price.toFixed(2)}
                  </span>
                  {key !== 'avulso' && (
                    <span className="text-muted-foreground text-sm ml-2">
                      (R$ {(config.price / config.baths).toFixed(2)}/banho)
                    </span>
                  )}
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    {config.baths} banho{config.baths > 1 ? 's' : ''}
                  </li>
                  {key !== 'avulso' && (
                    <>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success" />
                        Validade de 90 dias
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success" />
                        Desconto especial
                      </li>
                    </>
                  )}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Active Plans */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle>Planos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {plans.map((plan, index) => {
                const client = getClient(plan.clientId);
                const config = planConfig[plan.type];
                const progress = (plan.usedBaths / plan.totalBaths) * 100;
                const expired = isExpired(plan.validUntil);
                const nearExpiry = isNearExpiry(plan.validUntil);

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "p-4 rounded-xl border",
                      expired ? "bg-destructive/5 border-destructive/20" : "bg-card border-border"
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          expired ? "bg-destructive/10" : "bg-primary/10"
                        )}>
                          <CreditCard className={cn(
                            "w-5 h-5",
                            expired ? "text-destructive" : "text-primary"
                          )} />
                        </div>
                        <div>
                          <p className="font-semibold">{client?.name}</p>
                          <p className="text-sm text-muted-foreground">{config.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {expired ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Expirado
                          </Badge>
                        ) : nearExpiry ? (
                          <Badge variant="outline" className="border-warning text-warning gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Expira em breve
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-success text-success">
                            Ativo
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {plan.usedBaths} de {plan.totalBaths} banhos utilizados
                        </span>
                        <span className="font-medium">
                          {plan.remainingBaths} restantes
                        </span>
                      </div>
                      <Progress 
                        value={progress} 
                        className={cn(
                          "h-2",
                          expired && "[&>div]:bg-destructive"
                        )}
                      />
                      <p className="text-xs text-muted-foreground">
                        Válido até {new Date(plan.validUntil).toLocaleDateString('pt-BR')}
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
  );
};

export default Planos;
