import { useState, useEffect } from 'react';
import { CalendarCheck, Scissors, Home, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GroomingReservation {
  id: string;
  clientName: string;
  petName: string;
  service: string;
  status: string;
  price: number;
  scheduledAt: string;
}

interface HotelReservation {
  id: string;
  clientName: string;
  petName: string;
  checkIn: string;
  checkOut: string;
  status: string;
  totalPrice: number;
}

const statusColors: Record<string, string> = {
  agendado: 'bg-blue-100 text-blue-700',
  em_atendimento: 'bg-amber-100 text-amber-700',
  pronto: 'bg-green-100 text-green-700',
  finalizado: 'bg-gray-100 text-gray-700',
  reservado: 'bg-blue-100 text-blue-700',
  hospedado: 'bg-emerald-100 text-emerald-700',
  check_out_realizado: 'bg-gray-100 text-gray-700',
};

const statusLabels: Record<string, string> = {
  agendado: 'Agendado',
  em_atendimento: 'Em Atendimento',
  pronto: 'Pronto',
  finalizado: 'Finalizado',
  reservado: 'Reservado',
  hospedado: 'Hospedado',
  check_out_realizado: 'Check-out',
};

export function ScheduledReservations() {
  const [groomingReservations, setGroomingReservations] = useState<GroomingReservation[]>([]);
  const [hotelReservations, setHotelReservations] = useState<HotelReservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReservations = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch clients and pets for names
      const { data: clients } = await supabase.from('clients').select('id, name');
      const { data: pets } = await supabase.from('pets').select('id, name');

      const clientMap = new Map(clients?.map(c => [c.id, c.name]) || []);
      const petMap = new Map(pets?.map(p => [p.id, p.name]) || []);

      // Fetch grooming appointments (today + future, not finalized)
      const { data: groomingData } = await supabase
        .from('bath_grooming_appointments')
        .select('*')
        .gte('start_datetime', today.toISOString())
        .neq('status', 'finalizado')
        .order('start_datetime', { ascending: true });

      const groomingFormatted = (groomingData || []).map(apt => ({
        id: apt.id,
        clientName: clientMap.get(apt.client_id) || 'Cliente',
        petName: petMap.get(apt.pet_id) || 'Pet',
        service: apt.service_type === 'banho_tosa' ? 'Banho + Tosa' : 'Banho',
        status: apt.status || 'agendado',
        price: apt.price || 0,
        scheduledAt: apt.start_datetime,
      }));

      // Fetch hotel stays (active and future)
      const { data: hotelData } = await supabase
        .from('hotel_stays')
        .select('*')
        .or(`status.eq.reservado,status.eq.hospedado`)
        .order('check_in', { ascending: true });

      const hotelFormatted = (hotelData || []).map(stay => ({
        id: stay.id,
        clientName: clientMap.get(stay.client_id) || 'Cliente',
        petName: petMap.get(stay.pet_id) || 'Pet',
        checkIn: stay.check_in,
        checkOut: stay.check_out,
        status: stay.status || 'reservado',
        totalPrice: stay.total_price || 0,
      }));

      setGroomingReservations(groomingFormatted);
      setHotelReservations(hotelFormatted);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();

    // Realtime subscriptions
    const groomingChannel = supabase
      .channel('reservations-grooming')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bath_grooming_appointments' }, fetchReservations)
      .subscribe();

    const hotelChannel = supabase
      .channel('reservations-hotel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hotel_stays' }, fetchReservations)
      .subscribe();

    return () => {
      supabase.removeChannel(groomingChannel);
      supabase.removeChannel(hotelChannel);
    };
  }, []);

  const formatDateTime = (date: string) => {
    return format(new Date(date), "dd/MM 'às' HH:mm", { locale: ptBR });
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 rounded-2xl shadow-soft bg-card border border-border"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <CalendarCheck className="w-5 h-5 text-primary" />
        </div>
        <h3 className="font-semibold text-lg text-foreground">Reservas Agendadas</h3>
      </div>

      <Tabs defaultValue="grooming" className="w-full">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="grooming" className="flex-1 gap-2">
            <Scissors className="w-4 h-4" />
            Banho & Tosa ({groomingReservations.length})
          </TabsTrigger>
          <TabsTrigger value="hotel" className="flex-1 gap-2">
            <Home className="w-4 h-4" />
            Hotelzinho ({hotelReservations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grooming">
          <ScrollArea className="h-[350px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : groomingReservations.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum agendamento pendente
              </p>
            ) : (
              <div className="space-y-3 pr-4">
                {groomingReservations.map((res, index) => (
                  <motion.div
                    key={res.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-foreground truncate">{res.petName}</p>
                          <Badge className={cn("text-xs", statusColors[res.status])}>
                            {statusLabels[res.status]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{res.clientName}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(res.scheduledAt)}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">{res.service}</p>
                        <p className="font-bold text-primary">
                          R$ {res.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="hotel">
          <ScrollArea className="h-[350px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : hotelReservations.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma hospedagem ativa
              </p>
            ) : (
              <div className="space-y-3 pr-4">
                {hotelReservations.map((res, index) => (
                  <motion.div
                    key={res.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-foreground truncate">{res.petName}</p>
                          <Badge className={cn("text-xs", statusColors[res.status])}>
                            {statusLabels[res.status]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{res.clientName}</p>
                        <div className="flex flex-col gap-1 mt-2 text-xs text-muted-foreground">
                          <span>📥 Check-in: {formatDate(res.checkIn)}</span>
                          <span>📤 Check-out: {formatDate(res.checkOut)}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-primary">
                          R$ {res.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
