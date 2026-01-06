import { Trash2, Scissors, Hotel, Package, Gift, Check, Clock, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CartItem } from './types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface CartProps {
  items: CartItem[];
  onRemoveItem: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onApplyDiscount: (id: string, discount: number) => void;
}

const statusLabels: Record<string, string> = {
  agendado: 'Agendado',
  em_atendimento: 'Em Atendimento',
  pronto: 'Pronto',
  finalizado: 'Finalizado',
  reservado: 'Reservado',
  check_in: 'Check-in',
  hospedado: 'Hospedado',
};

const typeIcons = {
  product: Package,
  service_banho: Scissors,
  service_hotel: Hotel,
  service_consulta: Package,
  extra: Package,
};

const typeColors = {
  product: 'text-purple-500',
  service_banho: 'text-primary',
  service_hotel: 'text-orange-500',
  service_consulta: 'text-blue-500',
  extra: 'text-gray-500',
};

export function Cart({ items, onRemoveItem, onUpdateQuantity, onApplyDiscount }: CartProps) {
  return (
    <ScrollArea className="flex-1 pr-2">
      <AnimatePresence mode="popLayout">
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Carrinho vazio</p>
            <p className="text-sm mt-1">Adicione produtos ou serviços</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => {
              const Icon = typeIcons[item.type] || Package;
              const iconColor = typeColors[item.type] || 'text-gray-500';
              const isService = item.type.startsWith('service_');

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'p-4 rounded-xl border',
                    item.covered_by_plan
                      ? 'bg-green-50 border-green-200'
                      : isService && item.service_status !== 'finalizado'
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-card border-border'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Icon className={cn('w-5 h-5 mt-0.5', iconColor)} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.description}</p>
                        {item.pet_name && (
                          <p className="text-sm text-muted-foreground">{item.pet_name}</p>
                        )}
                        {isService && item.service_status && (
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {statusLabels[item.service_status] || item.service_status}
                            </Badge>
                            {!item.covered_by_plan && item.service_status !== 'finalizado' && (
                              <Badge variant="secondary" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                Pendente
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {item.type === 'product' || item.type === 'extra' ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                        onClick={() => onRemoveItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                    {/* Quantity */}
                    <div className="flex items-center gap-2">
                      {item.type === 'product' ? (
                        <>
                          <span className="text-xs text-muted-foreground">Qtd:</span>
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={e => onUpdateQuantity(item.id, Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-16 h-8 text-center"
                          />
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {item.quantity > 1 ? `${item.quantity}x R$ ${item.unit_price.toFixed(2)}` : ''}
                        </span>
                      )}
                    </div>

                    {/* Price */}
                    {item.covered_by_plan ? (
                      <Badge className="bg-green-100 text-green-700 border-0">
                        <Gift className="w-3 h-3 mr-1" />
                        Coberto pelo Plano
                      </Badge>
                    ) : (
                      <div className="flex items-center gap-2">
                        {item.discount_amount > 0 && (
                          <span className="text-xs line-through text-muted-foreground">
                            R$ {(item.unit_price * item.quantity).toFixed(2)}
                          </span>
                        )}
                        <span className="font-bold text-primary text-lg">
                          R$ {item.total_price.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Discount input for products */}
                  {item.type === 'product' && !item.covered_by_plan && (
                    <div className="flex items-center gap-2 mt-2">
                      <Percent className="w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min={0}
                        max={item.unit_price * item.quantity}
                        placeholder="Desconto"
                        value={item.discount_amount || ''}
                        onChange={e => onApplyDiscount(item.id, parseFloat(e.target.value) || 0)}
                        className="h-8 w-24"
                      />
                      <span className="text-xs text-muted-foreground">R$</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </ScrollArea>
  );
}
