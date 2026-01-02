import { motion } from 'framer-motion';
import { GroomingAppointment, Pet, Client } from '@/types';
import { mockPets, mockClients } from '@/data/mockData';
import { Clock, CheckCircle2, Loader2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AppointmentListProps {
  appointments: GroomingAppointment[];
  onPetReady?: (appointmentId: string) => void;
}

const statusConfig = {
  agendado: { icon: Calendar, label: 'Agendado', class: 'status-scheduled' },
  em_atendimento: { icon: Loader2, label: 'Em Atendimento', class: 'status-in-progress' },
  pronto: { icon: CheckCircle2, label: 'Pronto', class: 'status-ready' },
  finalizado: { icon: Clock, label: 'Finalizado', class: 'status-completed' },
};

export function AppointmentList({ appointments, onPetReady }: AppointmentListProps) {
  const getPet = (petId: string): Pet | undefined => mockPets.find(p => p.id === petId);
  const getClient = (clientId: string): Client | undefined => mockClients.find(c => c.id === clientId);

  return (
    <div className="space-y-3">
      {appointments.map((apt, index) => {
        const pet = getPet(apt.petId);
        const client = getClient(apt.clientId);
        const status = statusConfig[apt.status];
        const StatusIcon = status.icon;

        return (
          <motion.div
            key={apt.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 bg-card rounded-xl border border-border hover:shadow-soft transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-xl">🐕</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{pet?.name}</h4>
                  <p className="text-sm text-muted-foreground">{client?.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("status-badge", status.class)}>
                      <StatusIcon className={cn(
                        "w-3 h-3",
                        apt.status === 'em_atendimento' && "animate-spin"
                      )} />
                      {status.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(apt.scheduledAt).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-bold text-foreground">R$ {apt.price.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {apt.service.replace('_', ' + ')}
                  </p>
                </div>
                {apt.status === 'em_atendimento' && (
                  <Button 
                    size="sm"
                    className="bg-gradient-success hover:opacity-90"
                    onClick={() => onPetReady?.(apt.id)}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Pet Pronto
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
