import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, CreditCard, Banknote, Smartphone, AlertCircle, Clock, History, Edit2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type PaymentMethod = 'dinheiro' | 'pix' | 'credito' | 'debito';

interface PaymentConfirmation {
  id: string;
  originalAmount: number;
  confirmedAmount: number;
  paymentMethod: PaymentMethod;
  confirmedAt: string;
  confirmedBy?: string;
  notes?: string;
}

interface PaymentConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  paymentMethod: PaymentMethod;
  clientName: string;
  description: string;
  onConfirm: (confirmedAmount: number, paymentMethod: PaymentMethod, notes?: string) => void;
  onCancel: () => void;
  previousConfirmations?: PaymentConfirmation[];
}

const paymentMethods: { value: PaymentMethod; label: string; icon: typeof CreditCard }[] = [
  { value: 'dinheiro', label: 'Dinheiro', icon: Banknote },
  { value: 'pix', label: 'PIX', icon: Smartphone },
  { value: 'credito', label: 'Crédito', icon: CreditCard },
  { value: 'debito', label: 'Débito', icon: CreditCard },
];

export function PaymentConfirmationDialog({
  open,
  onOpenChange,
  amount,
  paymentMethod: initialPaymentMethod,
  clientName,
  description,
  onConfirm,
  onCancel,
  previousConfirmations = [],
}: PaymentConfirmationDialogProps) {
  const [confirmedAmount, setConfirmedAmount] = useState(amount.toFixed(2));
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(initialPaymentMethod);
  const [notes, setNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setConfirmedAmount(amount.toFixed(2));
      setSelectedPaymentMethod(initialPaymentMethod);
      setNotes('');
      setIsEditing(false);
      setShowHistory(false);
    }
  }, [open, amount, initialPaymentMethod]);

  const handleConfirm = () => {
    const numericAmount = parseFloat(confirmedAmount.replace(',', '.'));
    if (isNaN(numericAmount) || numericAmount < 0) {
      return;
    }
    onConfirm(numericAmount, selectedPaymentMethod, notes.trim() || undefined);
  };

  const numericConfirmedAmount = parseFloat(confirmedAmount.replace(',', '.')) || 0;
  const hasAmountDifference = Math.abs(numericConfirmedAmount - amount) > 0.01;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Confirmar Pagamento
          </DialogTitle>
          <DialogDescription>
            Verifique os dados antes de confirmar o recebimento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Client & Description */}
          <div className="p-4 bg-muted/50 rounded-xl">
            <p className="font-medium text-lg">{clientName}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          {/* Amount Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Valor a Receber</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="text-primary"
              >
                <Edit2 className="w-4 h-4 mr-1" />
                {isEditing ? 'Concluir' : 'Ajustar'}
              </Button>
            </div>

            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-muted-foreground">R$</span>
                    <Input
                      type="text"
                      value={confirmedAmount}
                      onChange={(e) => setConfirmedAmount(e.target.value)}
                      className="text-2xl font-bold h-14 text-right"
                      placeholder="0,00"
                    />
                  </div>
                  {hasAmountDifference && (
                    <div className="flex items-center gap-2 text-amber-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>
                        Valor original: R$ {amount.toFixed(2)} 
                        ({numericConfirmedAmount > amount ? '+' : ''}
                        R$ {(numericConfirmedAmount - amount).toFixed(2)})
                      </span>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    "p-4 rounded-xl border-2 text-center",
                    hasAmountDifference
                      ? "border-amber-300 bg-amber-50"
                      : "border-green-300 bg-green-50"
                  )}
                >
                  <p className="text-4xl font-bold text-foreground">
                    R$ {numericConfirmedAmount.toFixed(2)}
                  </p>
                  {hasAmountDifference && (
                    <p className="text-sm text-amber-600 mt-1">
                      Valor ajustado (original: R$ {amount.toFixed(2)})
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Separator />

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label className="text-base">Forma de Pagamento</Label>
            <div className="grid grid-cols-4 gap-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                const isSelected = selectedPaymentMethod === method.value;
                return (
                  <button
                    key={method.value}
                    onClick={() => setSelectedPaymentMethod(method.value)}
                    className={cn(
                      "p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs font-medium",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {method.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Observações (opcional)</Label>
            <Input
              placeholder="Ex: Troco de R$ 20,00..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Confirmation History */}
          {previousConfirmations.length > 0 && (
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="text-muted-foreground"
              >
                <History className="w-4 h-4 mr-1" />
                Histórico de alterações ({previousConfirmations.length})
              </Button>

              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 p-3 bg-muted/50 rounded-xl text-sm"
                  >
                    {previousConfirmations.map((conf, idx) => (
                      <div key={conf.id} className="flex items-center justify-between">
                        <div>
                          <span className="text-muted-foreground">
                            {new Date(conf.confirmedAt).toLocaleString('pt-BR')}
                          </span>
                          {conf.confirmedBy && (
                            <span className="ml-2 text-muted-foreground">
                              por {conf.confirmedBy}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span>R$ {conf.confirmedAmount.toFixed(2)}</span>
                          <Badge variant="outline" className="text-xs">
                            {paymentMethods.find(m => m.value === conf.paymentMethod)?.label}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-1" />
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-green-600 hover:bg-green-700"
            disabled={numericConfirmedAmount < 0}
          >
            <Check className="w-4 h-4 mr-1" />
            Confirmar Pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Status Badge Component for confirmed/pending payments
export function PaymentStatusBadge({ 
  status, 
  confirmedAt 
}: { 
  status: 'pendente' | 'confirmado' | 'pago';
  confirmedAt?: string;
}) {
  if (status === 'confirmado' || status === 'pago') {
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200">
        <Check className="w-3 h-3 mr-1" />
        Confirmado
        {confirmedAt && (
          <span className="ml-1 text-green-600/70">
            às {new Date(confirmedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className="bg-amber-100 text-amber-700 border-amber-200">
      <Clock className="w-3 h-3 mr-1" />
      Pendente
    </Badge>
  );
}
