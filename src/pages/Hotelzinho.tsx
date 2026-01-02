import { useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { motion } from 'framer-motion';
import { Plus, Home, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockHotelBookings, mockPets, mockClients } from '@/data/mockData';
import { HotelBooking, HotelStatus } from '@/types';

const statusColors: Record<HotelStatus, string> = {
  reservado: '#3b82f6',
  check_in: '#f59e0b',
  hospedado: '#22c55e',
  check_out: '#9ca3af',
};

const Hotelzinho = () => {
  const calendarRef = useRef<FullCalendar>(null);
  const [bookings, setBookings] = useState<HotelBooking[]>(mockHotelBookings);
  const [selectedBooking, setSelectedBooking] = useState<HotelBooking | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);

  const events = bookings.map(booking => {
    const pet = mockPets.find(p => p.id === booking.petId);
    const client = mockClients.find(c => c.id === booking.clientId);
    
    return {
      id: booking.id,
      title: `🐕 ${pet?.name} (${client?.name})`,
      start: booking.checkIn,
      end: booking.checkOut,
      backgroundColor: statusColors[booking.status],
      borderColor: statusColors[booking.status],
      extendedProps: booking,
    };
  });

  const handleEventClick = (info: any) => {
    const booking = bookings.find(b => b.id === info.event.id);
    if (booking) {
      setSelectedBooking(booking);
      setIsDialogOpen(true);
    }
  };

  const getPet = (petId: string) => mockPets.find(p => p.id === petId);
  const getClient = (clientId: string) => mockClients.find(c => c.id === clientId);

  const activeGuests = bookings.filter(b => b.status === 'hospedado');

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
              <Home className="w-8 h-8 text-primary" />
              Hotelzinho
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as reservas e hospedagens
            </p>
          </div>
          <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                Nova Reserva
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Reserva</DialogTitle>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Check-in</Label>
                    <Input type="date" />
                  </div>
                  <div>
                    <Label>Check-out</Label>
                    <Input type="date" />
                  </div>
                </div>
                <div>
                  <Label>Valor da Diária</Label>
                  <Input type="number" placeholder="R$ 0,00" />
                </div>
                <Button className="w-full bg-gradient-primary hover:opacity-90">
                  Reservar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Active Guests Summary */}
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
                <p className="text-white/80 text-sm">Hóspedes Ativos</p>
                <p className="text-3xl font-display font-bold mt-1">
                  {activeGuests.length} pet{activeGuests.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex gap-4">
                {activeGuests.slice(0, 4).map(guest => {
                  const pet = getPet(guest.petId);
                  return (
                    <div 
                      key={guest.id}
                      className="bg-white/10 rounded-xl p-3 text-center"
                    >
                      <div className="text-2xl mb-1">🐕</div>
                      <p className="text-sm font-medium">{pet?.name}</p>
                      <p className="text-xs text-white/60">
                        até {new Date(guest.checkOut).toLocaleDateString('pt-BR', { 
                          day: '2-digit', 
                          month: 'short' 
                        })}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Status Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex flex-wrap gap-4 mb-6"
      >
        {Object.entries(statusColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: color }}
            />
            <span className="text-sm text-muted-foreground capitalize">
              {status.replace('_', '-')}
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
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth',
              }}
              locale="pt-br"
              events={events}
              eventClick={handleEventClick}
              height="auto"
              buttonText={{
                today: 'Hoje',
                month: 'Mês',
              }}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Booking Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Hospedagem</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Pet</p>
                  <p className="font-semibold">{getPet(selectedBooking.petId)?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-semibold">{getClient(selectedBooking.clientId)?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Check-in</p>
                  <p className="font-semibold">
                    {new Date(selectedBooking.checkIn).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Check-out</p>
                  <p className="font-semibold">
                    {new Date(selectedBooking.checkOut).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Diária</p>
                  <p className="font-semibold">R$ {selectedBooking.dailyRate.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-semibold text-primary">
                    R$ {selectedBooking.totalPrice.toFixed(2)}
                  </p>
                </div>
                <div className="col-span-2">
                  <Label>Status</Label>
                  <Select defaultValue={selectedBooking.status}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reservado">Reservado</SelectItem>
                      <SelectItem value="check_in">Check-in</SelectItem>
                      <SelectItem value="hospedado">Hospedado</SelectItem>
                      <SelectItem value="check_out">Check-out</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Hotelzinho;
