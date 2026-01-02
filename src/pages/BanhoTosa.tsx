import { useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { motion } from 'framer-motion';
import { Plus, Scissors, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { mockGroomingAppointments, mockPets, mockClients } from '@/data/mockData';
import { GroomingAppointment, AppointmentStatus } from '@/types';
import { cn } from '@/lib/utils';

const statusColors: Record<AppointmentStatus, string> = {
  agendado: '#3b82f6',
  em_atendimento: '#f59e0b',
  pronto: '#22c55e',
  finalizado: '#9ca3af',
};

const BanhoTosa = () => {
  const { toast } = useToast();
  const calendarRef = useRef<FullCalendar>(null);
  const [appointments, setAppointments] = useState<GroomingAppointment[]>(mockGroomingAppointments);
  const [selectedAppointment, setSelectedAppointment] = useState<GroomingAppointment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);

  const events = appointments.map(apt => {
    const pet = mockPets.find(p => p.id === apt.petId);
    const client = mockClients.find(c => c.id === apt.clientId);
    
    return {
      id: apt.id,
      title: `${pet?.name} - ${apt.service === 'banho' ? 'Banho' : 'Banho + Tosa'}`,
      start: apt.scheduledAt,
      backgroundColor: statusColors[apt.status],
      borderColor: statusColors[apt.status],
      extendedProps: {
        ...apt,
        petName: pet?.name,
        clientName: client?.name,
      },
    };
  });

  const handleEventClick = (info: any) => {
    const apt = appointments.find(a => a.id === info.event.id);
    if (apt) {
      setSelectedAppointment(apt);
      setIsDialogOpen(true);
    }
  };

  const handleStatusChange = (status: AppointmentStatus) => {
    if (!selectedAppointment) return;

    setAppointments(prev => 
      prev.map(apt => 
        apt.id === selectedAppointment.id ? { ...apt, status } : apt
      )
    );

    if (status === 'pronto') {
      toast({
        title: "🎉 Pet Pronto!",
        description: "Webhook disparado para o n8n. WhatsApp será enviado ao cliente.",
      });
    }

    setSelectedAppointment({ ...selectedAppointment, status });
  };

  const handlePetReady = () => {
    handleStatusChange('pronto');
    setIsDialogOpen(false);
  };

  const getPet = (petId: string) => mockPets.find(p => p.id === petId);
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
              <Scissors className="w-8 h-8 text-primary" />
              Banho & Tosa
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os agendamentos de banho e tosa
            </p>
          </div>
          <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                Novo Agendamento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Agendamento</DialogTitle>
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
                  <Label>Pet</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o pet" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockPets.map(pet => (
                        <SelectItem key={pet.id} value={pet.id}>
                          {pet.name} ({pet.breed})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Serviço</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="banho">Banho</SelectItem>
                      <SelectItem value="banho_tosa">Banho + Tosa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data e Hora</Label>
                  <Input type="datetime-local" />
                </div>
                <Button className="w-full bg-gradient-primary hover:opacity-90">
                  Agendar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Status Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-4 mb-6"
      >
        {Object.entries(statusColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: color }}
            />
            <span className="text-sm text-muted-foreground capitalize">
              {status.replace('_', ' ')}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-soft">
          <CardContent className="p-6">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'timeGridDay,timeGridWeek,dayGridMonth',
              }}
              locale="pt-br"
              events={events}
              eventClick={handleEventClick}
              slotMinTime="08:00:00"
              slotMaxTime="20:00:00"
              allDaySlot={false}
              height="auto"
              expandRows={true}
              stickyHeaderDates={true}
              nowIndicator={true}
              slotLabelFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }}
              buttonText={{
                today: 'Hoje',
                month: 'Mês',
                week: 'Semana',
                day: 'Dia',
              }}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Appointment Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Atendimento</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Pet</p>
                  <p className="font-semibold">{getPet(selectedAppointment.petId)?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-semibold">{getClient(selectedAppointment.clientId)?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Raça</p>
                  <p className="font-semibold">{getPet(selectedAppointment.petId)?.breed}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Peso</p>
                  <p className="font-semibold">{getPet(selectedAppointment.petId)?.weight} kg</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo de Pelo</p>
                  <p className="font-semibold capitalize">
                    {getPet(selectedAppointment.petId)?.furType.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Serviço</p>
                  <p className="font-semibold capitalize">
                    {selectedAppointment.service.replace('_', ' + ')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor</p>
                  <p className="font-semibold text-primary">
                    R$ {selectedAppointment.price.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Select 
                    value={selectedAppointment.status}
                    onValueChange={(value) => handleStatusChange(value as AppointmentStatus)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agendado">Agendado</SelectItem>
                      <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
                      <SelectItem value="pronto">Pronto</SelectItem>
                      <SelectItem value="finalizado">Finalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedAppointment.status === 'em_atendimento' && (
                <Button 
                  className="w-full bg-gradient-success hover:opacity-90"
                  onClick={handlePetReady}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Pet Pronto - Notificar Cliente
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BanhoTosa;
