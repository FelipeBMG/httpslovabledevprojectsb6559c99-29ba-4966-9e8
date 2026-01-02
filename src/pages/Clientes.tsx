import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Search, Phone, Mail, Dog, Cat, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { mockClients, mockPets } from '@/data/mockData';
import { Client, Pet, FurType } from '@/types';
import { cn } from '@/lib/utils';

const furTypeLabels: Record<FurType, string> = {
  curto: 'Curto',
  medio: 'Médio',
  longo: 'Longo',
  muito_peludo: 'Muito Peludo',
};

const Clientes = () => {
  const [clients] = useState<Client[]>(mockClients);
  const [pets] = useState<Pet[]>(mockPets);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isPetDialogOpen, setIsPetDialogOpen] = useState(false);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.whatsapp.includes(searchTerm)
  );

  const getClientPets = (clientId: string) => pets.filter(p => p.clientId === clientId);

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
              <Users className="w-8 h-8 text-primary" />
              Clientes & Pets
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie sua base de clientes e seus pets
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isPetDialogOpen} onOpenChange={setIsPetDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Pet
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cadastrar Novo Pet</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Dono</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Nome do Pet</Label>
                    <Input placeholder="Ex: Thor" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Espécie</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Espécie" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cachorro">Cachorro</SelectItem>
                          <SelectItem value="gato">Gato</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Raça</Label>
                      <Input placeholder="Ex: Golden Retriever" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo de Pelo</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo de pelo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="curto">Curto</SelectItem>
                          <SelectItem value="medio">Médio</SelectItem>
                          <SelectItem value="longo">Longo</SelectItem>
                          <SelectItem value="muito_peludo">Muito Peludo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Peso (kg)</Label>
                      <Input type="number" placeholder="Ex: 15" />
                    </div>
                  </div>
                  <Button className="w-full bg-gradient-primary hover:opacity-90">
                    Cadastrar Pet
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary hover:opacity-90">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Nome Completo</Label>
                    <Input placeholder="Ex: Maria Silva" />
                  </div>
                  <div>
                    <Label>WhatsApp</Label>
                    <Input placeholder="Ex: 11999887766" />
                  </div>
                  <div>
                    <Label>Email (opcional)</Label>
                    <Input type="email" placeholder="Ex: maria@email.com" />
                  </div>
                  <Button className="w-full bg-gradient-primary hover:opacity-90">
                    Cadastrar Cliente
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou WhatsApp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
      >
        <Card className="border-0 shadow-soft">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{clients.length}</p>
              <p className="text-sm text-muted-foreground">Clientes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-soft">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
              <Dog className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pets.filter(p => p.species === 'cachorro').length}</p>
              <p className="text-sm text-muted-foreground">Cachorros</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-soft">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
              <Cat className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pets.filter(p => p.species === 'gato').length}</p>
              <p className="text-sm text-muted-foreground">Gatos</p>
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
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filteredClients.map((client, index) => {
                const clientPets = getClientPets(client.id);
                
                return (
                  <motion.div
                    key={client.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{client.name}</h4>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {client.whatsapp}
                            </span>
                            {client.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {client.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {/* Pets */}
                        <div className="flex items-center gap-2">
                          {clientPets.map(pet => (
                            <div
                              key={pet.id}
                              className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full"
                            >
                              <span>{pet.species === 'cachorro' ? '🐕' : '🐈'}</span>
                              <span className="text-sm font-medium">{pet.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {furTypeLabels[pet.furType]}
                              </Badge>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
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

export default Clientes;
