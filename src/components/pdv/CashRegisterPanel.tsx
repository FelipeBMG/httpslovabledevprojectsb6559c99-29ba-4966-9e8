import { useState } from 'react';
import { DollarSign, LockOpen, X, Plus, Minus, ArrowDownCircle, ArrowUpCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { CashRegister, CashMovement } from './types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CashRegisterPanelProps {
  currentCash: CashRegister | null;
  movements: CashMovement[];
  currentBalance: number;
  totalSalesToday: number;
  onOpenCash: (amount: number, notes?: string) => Promise<{ success: boolean; error?: string }>;
  onCloseCash: (amount: number, notes?: string) => Promise<{ success: boolean; difference?: number; error?: string }>;
  onAddMovement: (type: 'withdrawal' | 'supply', amount: number, reason?: string) => Promise<{ success: boolean; error?: string }>;
  disabled?: boolean;
}

export function CashRegisterPanel({
  currentCash,
  movements,
  currentBalance,
  totalSalesToday,
  onOpenCash,
  onCloseCash,
  onAddMovement,
  disabled,
}: CashRegisterPanelProps) {
  const { toast } = useToast();
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showMovementDialog, setShowMovementDialog] = useState(false);
  const [movementType, setMovementType] = useState<'withdrawal' | 'supply'>('withdrawal');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenCash = async () => {
    const value = parseFloat(amount.replace(',', '.')) || 0;
    setIsLoading(true);
    const result = await onOpenCash(value, notes);
    setIsLoading(false);

    if (result.success) {
      toast({ title: '✅ Caixa aberto', description: `Valor inicial: R$ ${value.toFixed(2)}` });
      setShowOpenDialog(false);
      setAmount('');
      setNotes('');
    } else {
      toast({ title: 'Erro', description: result.error, variant: 'destructive' });
    }
  };

  const handleCloseCash = async () => {
    const value = parseFloat(amount.replace(',', '.')) || 0;
    setIsLoading(true);
    const result = await onCloseCash(value, notes);
    setIsLoading(false);

    if (result.success) {
      const diffText = result.difference !== undefined 
        ? result.difference >= 0 
          ? `Sobra: R$ ${result.difference.toFixed(2)}`
          : `Falta: R$ ${Math.abs(result.difference).toFixed(2)}`
        : '';
      toast({ title: '✅ Caixa fechado', description: diffText });
      setShowCloseDialog(false);
      setAmount('');
      setNotes('');
    } else {
      toast({ title: 'Erro', description: result.error, variant: 'destructive' });
    }
  };

  const handleAddMovement = async () => {
    const value = parseFloat(amount.replace(',', '.'));
    if (!value || value <= 0) {
      toast({ title: 'Valor inválido', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    const result = await onAddMovement(movementType, value, notes);
    setIsLoading(false);

    if (result.success) {
      const label = movementType === 'withdrawal' ? 'Sangria' : 'Suprimento';
      toast({ title: `✅ ${label} registrada`, description: `R$ ${value.toFixed(2)}` });
      setShowMovementDialog(false);
      setAmount('');
      setNotes('');
    } else {
      toast({ title: 'Erro', description: result.error, variant: 'destructive' });
    }
  };

  if (disabled) {
    return null;
  }

  return (
    <>
      <Card className="border-0 shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Caixa
            </span>
            {currentCash ? (
              <Badge className="bg-green-100 text-green-700">Aberto</Badge>
            ) : (
              <Badge variant="secondary">Fechado</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentCash ? (
            <>
              <div className="text-center py-2">
                <p className="text-sm text-muted-foreground">Saldo Atual</p>
                <p className="text-3xl font-bold text-primary">
                  R$ {currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground text-xs">Abertura</p>
                  <p className="font-medium">R$ {currentCash.opening_amount.toFixed(2)}</p>
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                  <p className="text-muted-foreground text-xs">Vendas Hoje</p>
                  <p className="font-medium text-green-700">R$ {totalSalesToday.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setMovementType('withdrawal');
                    setShowMovementDialog(true);
                  }}
                >
                  <ArrowDownCircle className="w-4 h-4 mr-1" />
                  Sangria
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setMovementType('supply');
                    setShowMovementDialog(true);
                  }}
                >
                  <ArrowUpCircle className="w-4 h-4 mr-1" />
                  Suprimento
                </Button>
              </div>

              {movements.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    <p className="text-xs text-muted-foreground font-medium">Movimentações</p>
                    {movements.slice(0, 5).map(m => (
                      <div key={m.id} className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded">
                        <span className="flex items-center gap-1">
                          {m.type === 'withdrawal' ? (
                            <Minus className="w-3 h-3 text-red-500" />
                          ) : (
                            <Plus className="w-3 h-3 text-green-500" />
                          )}
                          {m.reason || (m.type === 'withdrawal' ? 'Sangria' : 'Suprimento')}
                        </span>
                        <span className={m.type === 'withdrawal' ? 'text-red-600' : 'text-green-600'}>
                          {m.type === 'withdrawal' ? '-' : '+'}R$ {m.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setShowCloseDialog(true)}
              >
                <X className="w-4 h-4 mr-2" />
                Fechar Caixa
              </Button>
            </>
          ) : (
            <div className="text-center py-4 space-y-4">
              <div className="flex items-center justify-center gap-2 text-amber-600">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm font-medium">Caixa não está aberto</p>
              </div>
              <Button onClick={() => setShowOpenDialog(true)} className="w-full">
                <LockOpen className="w-4 h-4 mr-2" />
                Abrir Caixa
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Open Cash Dialog */}
      <Dialog open={showOpenDialog} onOpenChange={setShowOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir Caixa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Valor Inicial (Fundo de Troco)</Label>
              <Input
                type="text"
                placeholder="0,00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="text-lg font-medium"
              />
            </div>
            <div>
              <Label>Observações (opcional)</Label>
              <Textarea
                placeholder="Observações sobre a abertura..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOpenDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleOpenCash} disabled={isLoading}>
              {isLoading ? 'Abrindo...' : 'Abrir Caixa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Cash Dialog */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechar Caixa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Valor inicial:</span>
                <span>R$ {currentCash?.opening_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Vendas do dia:</span>
                <span className="text-green-600">+ R$ {totalSalesToday.toFixed(2)}</span>
              </div>
              {movements.length > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span>Suprimentos:</span>
                    <span className="text-green-600">
                      + R$ {movements.filter(m => m.type === 'supply').reduce((a, m) => a + m.amount, 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Sangrias:</span>
                    <span className="text-red-600">
                      - R$ {movements.filter(m => m.type === 'withdrawal').reduce((a, m) => a + m.amount, 0).toFixed(2)}
                    </span>
                  </div>
                </>
              )}
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Saldo esperado:</span>
                <span className="text-primary">R$ {currentBalance.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <Label>Valor em Caixa (contagem real)</Label>
              <Input
                type="text"
                placeholder="0,00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="text-lg font-medium"
              />
            </div>
            <div>
              <Label>Observações (opcional)</Label>
              <Textarea
                placeholder="Observações sobre o fechamento..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleCloseCash} disabled={isLoading}>
              {isLoading ? 'Fechando...' : 'Confirmar Fechamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Movement Dialog */}
      <Dialog open={showMovementDialog} onOpenChange={setShowMovementDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {movementType === 'withdrawal' ? 'Sangria de Caixa' : 'Suprimento de Caixa'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Valor</Label>
              <Input
                type="text"
                placeholder="0,00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="text-lg font-medium"
              />
            </div>
            <div>
              <Label>Motivo</Label>
              <Textarea
                placeholder={movementType === 'withdrawal' ? 'Ex: Pagamento de fornecedor' : 'Ex: Troco adicional'}
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMovementDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddMovement}
              disabled={isLoading}
              className={movementType === 'withdrawal' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {isLoading ? 'Registrando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
