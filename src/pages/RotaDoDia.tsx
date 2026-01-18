import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Phone, Car, User, Dog, Pencil, Navigation, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ClientEditDialog from '@/components/rota/ClientEditDialog';

interface PetDB {
  id: string;
  name: string;
  client_id: string;
  address?: string | null;
  neighborhood?: string | null;
  zip_code?: string | null;
  pickup_time?: string | null;
  delivery_time?: string | null;
}

interface ClientDB {
  id: string;
  name: string;
  whatsapp: string;
  address?: string | null;
  address_number?: string | null;
  address_complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
}

interface AppointmentDB {
  id: string;
  client_id: string;
  pet_id: string;
  service_type: string;
  start_datetime: string;
  status: string | null;
  rota_buscar?: boolean | null;
  rota_entregar?: boolean | null;
}

interface RouteItem {
  id: string;
  pet_name: string;
  full_address: string;
  time: string | null;
  client_id: string;
  client_name: string;
  client_whatsapp: string;
  client_address: string;
  client_address_number: string;
  client_address_complement: string;
  client_neighborhood: string;
  client_city: string;
  client_state: string;
  client_zip_code: string;
  service_type: string;
  service_id: string;
}

const RotaDoDia = () => {
  const [pickupPets, setPickupPets] = useState<RouteItem[]>([]);
  const [deliveryPets, setDeliveryPets] = useState<RouteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingClient, setEditingClient] = useState<RouteItem | null>(null);

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    fetchRoutePets();
  }, []);

  const fetchRoutePets = async () => {
    setLoading(true);

    const [petsRes, clientsRes, appointmentsRes] = await Promise.all([
      supabase.from('pets').select('*'),
      supabase.from('clients').select('*'),
      supabase.from('bath_grooming_appointments').select('*')
        .gte('start_datetime', `${today}T00:00:00`)
        .lt('start_datetime', `${today}T23:59:59`)
        .neq('status', 'cancelado'),
    ]);

    const pets = (petsRes.data || []) as unknown as PetDB[];
    const clients = (clientsRes.data || []) as unknown as ClientDB[];
    const appointments = (appointmentsRes.data || []) as unknown as AppointmentDB[];

    const getClient = (clientId: string) => clients.find(c => c.id === clientId);
    const getPet = (petId: string) => pets.find(p => p.id === petId);

    const pickupList: RouteItem[] = [];
    const deliveryList: RouteItem[] = [];

    const buildFullAddress = (pet: PetDB, client: ClientDB): string => {
      const parts: string[] = [];
      const address = pet.address || client.address;
      const neighborhood = pet.neighborhood || client.neighborhood;
      const zipCode = pet.zip_code || client.zip_code;
      const city = client.city;
      const state = client.state;
      const number = client.address_number;
      const complement = client.address_complement;
      
      if (address) {
        let streetLine = address;
        if (number) streetLine += `, ${number}`;
        if (complement) streetLine += ` - ${complement}`;
        parts.push(streetLine);
      }
      if (neighborhood) parts.push(neighborhood);
      if (city && state) {
        parts.push(`${city} - ${state}`);
      } else if (city) {
        parts.push(city);
      }
      if (zipCode) parts.push(`CEP: ${zipCode}`);
      
      return parts.join(' • ') || 'Endereço não informado';
    };

    appointments.forEach(apt => {
      const pet = getPet(apt.pet_id);
      const client = getClient(apt.client_id);
      
      if (!pet || !client) return;

      const baseItem: RouteItem = {
        id: apt.id,
        pet_name: pet.name,
        full_address: buildFullAddress(pet, client),
        time: null,
        client_id: client.id,
        client_name: client.name,
        client_whatsapp: client.whatsapp || '',
        client_address: client.address || '',
        client_address_number: client.address_number || '',
        client_address_complement: client.address_complement || '',
        client_neighborhood: client.neighborhood || '',
        client_city: client.city || '',
        client_state: client.state || '',
        client_zip_code: client.zip_code || '',
        service_type: apt.service_type === 'banho' ? 'Banho' : 'Banho + Tosa',
        service_id: apt.id,
      };

      if (apt.rota_buscar === true) {
        pickupList.push({ ...baseItem, time: pet.pickup_time || null });
      }

      if (apt.rota_entregar === true) {
        deliveryList.push({ ...baseItem, time: pet.delivery_time || null });
      }
    });

    pickupList.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
    deliveryList.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

    setPickupPets(pickupList);
    setDeliveryPets(deliveryList);
    setLoading(false);
  };

  const openGoogleMaps = (address: string) => {
    const encoded = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank');
  };

  const RouteCard = ({ item, type }: { item: RouteItem; type: 'pickup' | 'delivery' }) => {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="p-4 border rounded-xl bg-card hover:shadow-md transition-all group"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              type === 'pickup' ? 'bg-blue-500/10' : 'bg-green-500/10'
            }`}>
              <Dog className={`w-5 h-5 ${type === 'pickup' ? 'text-blue-500' : 'text-green-500'}`} />
            </div>
            <div>
              <p className="font-semibold">{item.pet_name}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3" /> {item.client_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{item.service_type}</Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setEditingClient(item)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Editar cliente</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        <div className="mt-3 space-y-2">
          {/* Endereço com botão de navegação */}
          <div className="flex items-start gap-2 text-sm group/address">
            <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-foreground">{item.full_address}</span>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover/address:opacity-100 transition-opacity"
                    onClick={() => openGoogleMaps(item.full_address)}
                  >
                    <Navigation className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Abrir no Google Maps</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {item.time && (
            <div className="flex items-center gap-1 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{type === 'pickup' ? 'Buscar' : 'Entregar'}: {item.time}</span>
            </div>
          )}
          
          {item.client_whatsapp && (
            <div className="flex items-center justify-between">
              <a 
                href={`https://wa.me/55${item.client_whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-green-600 hover:underline"
              >
                <Phone className="w-4 h-4" />
                {item.client_whatsapp}
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
          <Car className="w-8 h-8 text-primary" />
          Rota do Dia
        </h1>
        <p className="text-muted-foreground mt-1">
          {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Buscar */}
        <Card className="border-0 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                <Car className="w-4 h-4 text-blue-500" />
              </div>
              🔵 Buscar ({pickupPets.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-center text-muted-foreground py-4">Carregando...</p>
            ) : pickupPets.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Nenhum pet para buscar hoje
              </p>
            ) : (
              <AnimatePresence>
                {pickupPets.map((item) => (
                  <RouteCard key={`pickup-${item.service_id}`} item={item} type="pickup" />
                ))}
              </AnimatePresence>
            )}
          </CardContent>
        </Card>

        {/* Entregar */}
        <Card className="border-0 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
                <MapPin className="w-4 h-4 text-green-500" />
              </div>
              🟢 Entregar ({deliveryPets.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-center text-muted-foreground py-4">Carregando...</p>
            ) : deliveryPets.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Nenhum pet para entregar hoje
              </p>
            ) : (
              <AnimatePresence>
                {deliveryPets.map((item) => (
                  <RouteCard key={`delivery-${item.service_id}`} item={item} type="delivery" />
                ))}
              </AnimatePresence>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de edição */}
      {editingClient && (
        <ClientEditDialog
          open={!!editingClient}
          onOpenChange={(open) => !open && setEditingClient(null)}
          client={{
            id: editingClient.client_id,
            name: editingClient.client_name,
            whatsapp: editingClient.client_whatsapp,
            address: editingClient.client_address,
            address_number: editingClient.client_address_number,
            address_complement: editingClient.client_address_complement,
            neighborhood: editingClient.client_neighborhood,
            city: editingClient.client_city,
            state: editingClient.client_state,
            zip_code: editingClient.client_zip_code,
          }}
          onSave={fetchRoutePets}
        />
      )}
    </div>
  );
};

export default RotaDoDia;
