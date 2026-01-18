import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Undo2, Save, MapPin, User, Phone, Home, Hash, Building } from 'lucide-react';

interface ClientData {
  id: string;
  name: string;
  whatsapp: string;
  address: string;
  address_number: string;
  address_complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
}

interface ClientEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientData;
  onSave: () => void;
}

const ClientEditDialog = ({ open, onOpenChange, client, onSave }: ClientEditDialogProps) => {
  const [formData, setFormData] = useState<ClientData>(client);
  const [originalData] = useState<ClientData>(client);
  const [saving, setSaving] = useState(false);

  const handleChange = (field: keyof ClientData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUndo = () => {
    setFormData(originalData);
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          name: formData.name.trim(),
          whatsapp: formData.whatsapp.trim(),
          address: formData.address.trim() || null,
          address_number: formData.address_number.trim() || null,
          address_complement: formData.address_complement.trim() || null,
          neighborhood: formData.neighborhood.trim() || null,
          city: formData.city.trim() || null,
          state: formData.state.trim() || null,
          zip_code: formData.zip_code.trim() || null,
        })
        .eq('id', client.id);

      if (error) throw error;

      toast.success('Cliente atualizado com sucesso!');
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      toast.error('Erro ao atualizar cliente');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Editar Cliente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="w-4 h-4" /> Nome *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Nome do cliente"
            />
          </div>

          {/* WhatsApp */}
          <div className="space-y-2">
            <Label htmlFor="whatsapp" className="flex items-center gap-2">
              <Phone className="w-4 h-4" /> WhatsApp
            </Label>
            <Input
              id="whatsapp"
              value={formData.whatsapp}
              onChange={(e) => handleChange('whatsapp', e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Endereço
            </p>

            {/* Rua */}
            <div className="space-y-2 mb-3">
              <Label htmlFor="address" className="flex items-center gap-2">
                <Home className="w-4 h-4" /> Rua/Logradouro
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Rua, Avenida..."
              />
            </div>

            {/* Número e Complemento */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="space-y-2">
                <Label htmlFor="address_number" className="flex items-center gap-2">
                  <Hash className="w-4 h-4" /> Número
                </Label>
                <Input
                  id="address_number"
                  value={formData.address_number}
                  onChange={(e) => handleChange('address_number', e.target.value)}
                  placeholder="123"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_complement">Complemento</Label>
                <Input
                  id="address_complement"
                  value={formData.address_complement}
                  onChange={(e) => handleChange('address_complement', e.target.value)}
                  placeholder="Apto, Bloco..."
                />
              </div>
            </div>

            {/* Bairro */}
            <div className="space-y-2 mb-3">
              <Label htmlFor="neighborhood" className="flex items-center gap-2">
                <Building className="w-4 h-4" /> Bairro
              </Label>
              <Input
                id="neighborhood"
                value={formData.neighborhood}
                onChange={(e) => handleChange('neighborhood', e.target.value)}
                placeholder="Bairro"
              />
            </div>

            {/* Cidade, Estado, CEP */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Cidade"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">UF</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value.toUpperCase().slice(0, 2))}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip_code">CEP</Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={(e) => handleChange('zip_code', e.target.value)}
                  placeholder="00000-000"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleUndo}
            disabled={!hasChanges || saving}
            className="gap-2"
          >
            <Undo2 className="w-4 h-4" />
            Desfazer
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClientEditDialog;
