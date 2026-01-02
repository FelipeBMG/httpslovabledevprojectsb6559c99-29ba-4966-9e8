import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserX, Calendar, ShoppingBag, Send, Filter, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { mockClients } from '@/data/mockData';
import { Client } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const inactivityPeriods = [
  { value: '30', label: '30 dias' },
  { value: '50', label: '50 dias' },
  { value: '60', label: '60 dias' },
  { value: '90', label: '90 dias' },
];

const Inativos = () => {
  const { toast } = useToast();
  const [period, setPeriod] = useState('30');
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  // Filter inactive clients based on period
  const inactiveClients = mockClients.filter(client => {
    const lastActivity = client.lastInteraction && client.lastPurchase
      ? new Date(Math.max(
          new Date(client.lastInteraction).getTime(),
          new Date(client.lastPurchase).getTime()
        ))
      : client.lastInteraction || client.lastPurchase;
    
    if (!lastActivity) return true;
    
    const daysSinceActivity = differenceInDays(new Date(), lastActivity);
    return daysSinceActivity >= parseInt(period);
  });

  const toggleClient = (clientId: string) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const toggleAll = () => {
    if (selectedClients.length === inactiveClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(inactiveClients.map(c => c.id));
    }
  };

  const handleSendCampaign = () => {
    if (selectedClients.length === 0) {
      toast({
        title: "Nenhum cliente selecionado",
        description: "Selecione pelo menos um cliente para enviar a campanha.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "📤 Campanha Enviada!",
      description: `Webhook disparado para o n8n com ${selectedClients.length} cliente(s). O n8n controlará o envio das mensagens.`,
    });
    setSelectedClients([]);
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
              <UserX className="w-8 h-8 text-primary" />
              Clientes Inativos
            </h1>
            <p className="text-muted-foreground mt-1">
              Reengaje clientes que não interagem há algum tempo
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {inactivityPeriods.map(p => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              className="bg-gradient-primary hover:opacity-90"
              onClick={handleSendCampaign}
              disabled={selectedClients.length === 0}
            >
              <Send className="w-4 h-4 mr-2" />
              Enviar Campanha ({selectedClients.length})
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <Card className="border-0 shadow-soft bg-gradient-hero text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Clientes inativos há mais de {period} dias</p>
                <p className="text-3xl font-display font-bold mt-1">
                  {inactiveClients.length} cliente{inactiveClients.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/80 text-sm">O n8n será responsável por:</p>
                <ul className="text-sm mt-2 space-y-1">
                  <li>• Controlar tempo entre mensagens</li>
                  <li>• Variar textos</li>
                  <li>• Respeitar limites da API</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Client List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Lista de Inativos</CardTitle>
            <Button variant="ghost" size="sm" onClick={toggleAll}>
              {selectedClients.length === inactiveClients.length ? (
                <>
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Desmarcar Todos
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  Selecionar Todos
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            {inactiveClients.length === 0 ? (
              <div className="text-center py-12">
                <UserX className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhum cliente inativo encontrado para este período! 🎉
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {inactiveClients.map((client, index) => (
                  <motion.div
                    key={client.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedClients.includes(client.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                    onClick={() => toggleClient(client.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={selectedClients.includes(client.id)}
                          onCheckedChange={() => toggleClient(client.id)}
                        />
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-muted-foreground font-bold">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-semibold">{client.name}</h4>
                          <p className="text-sm text-muted-foreground">{client.whatsapp}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>Última interação</span>
                          </div>
                          <p className="font-medium">
                            {client.lastInteraction
                              ? formatDistanceToNow(client.lastInteraction, { addSuffix: true, locale: ptBR })
                              : 'Nunca'}
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <ShoppingBag className="w-3 h-3" />
                            <span>Última compra</span>
                          </div>
                          <p className="font-medium">
                            {client.lastPurchase
                              ? formatDistanceToNow(client.lastPurchase, { addSuffix: true, locale: ptBR })
                              : 'Nunca'}
                          </p>
                        </div>
                        <Badge variant="outline" className="border-warning text-warning">
                          {differenceInDays(new Date(), client.lastInteraction || client.lastPurchase || client.createdAt)} dias
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Inativos;
