import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CashRegister, CashMovement } from '@/components/pdv/types';

export function useCashRegister() {
  const [currentCash, setCurrentCash] = useState<CashRegister | null>(null);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalSalesToday, setTotalSalesToday] = useState(0);

  const fetchCurrentCash = useCallback(async () => {
    try {
      // Get today's open cash register
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await (supabase as any)
        .from('cash_register')
        .select('*')
        .eq('status', 'open')
        .gte('opened_at', today.toISOString())
        .order('opened_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setCurrentCash(data);

      // If there's an open cash, get movements
      if (data) {
        const { data: movs } = await (supabase as any)
          .from('cash_movements')
          .select('*')
          .eq('cash_register_id', data.id)
          .order('created_at', { ascending: false });

        setMovements(movs || []);

        // Calculate today's sales total
        const { data: sales } = await (supabase as any)
          .from('sales')
          .select('total_amount')
          .eq('cash_register_id', data.id)
          .eq('payment_status', 'pago');

        const total = (sales || []).reduce((acc: number, s: any) => acc + (s.total_amount || 0), 0);
        setTotalSalesToday(total);
      }
    } catch (error) {
      console.error('Error fetching cash register:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentCash();
  }, [fetchCurrentCash]);

  const openCash = async (openingAmount: number, notes?: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('cash_register')
        .insert({
          opening_amount: openingAmount,
          status: 'open',
          notes,
        })
        .select()
        .single();

      if (error) throw error;
      setCurrentCash(data);
      return { success: true, data };
    } catch (error: any) {
      console.error('Error opening cash:', error);
      return { success: false, error: error.message };
    }
  };

  const closeCash = async (closingAmount: number, notes?: string) => {
    if (!currentCash) return { success: false, error: 'Nenhum caixa aberto' };

    try {
      // Calculate expected amount
      const withdrawals = movements
        .filter(m => m.type === 'withdrawal')
        .reduce((acc, m) => acc + m.amount, 0);
      const supplies = movements
        .filter(m => m.type === 'supply')
        .reduce((acc, m) => acc + m.amount, 0);

      const expectedAmount = currentCash.opening_amount + totalSalesToday + supplies - withdrawals;
      const difference = closingAmount - expectedAmount;

      const { error } = await (supabase as any)
        .from('cash_register')
        .update({
          closing_amount: closingAmount,
          expected_amount: expectedAmount,
          difference,
          status: 'closed',
          closed_at: new Date().toISOString(),
          notes: notes ? `${currentCash.notes || ''}\n${notes}` : currentCash.notes,
        })
        .eq('id', currentCash.id);

      if (error) throw error;
      setCurrentCash(null);
      setMovements([]);
      setTotalSalesToday(0);
      return { success: true, difference };
    } catch (error: any) {
      console.error('Error closing cash:', error);
      return { success: false, error: error.message };
    }
  };

  const addMovement = async (type: 'withdrawal' | 'supply', amount: number, reason?: string) => {
    if (!currentCash) return { success: false, error: 'Nenhum caixa aberto' };

    try {
      const { data, error } = await (supabase as any)
        .from('cash_movements')
        .insert({
          cash_register_id: currentCash.id,
          type,
          amount,
          reason,
        })
        .select()
        .single();

      if (error) throw error;
      setMovements(prev => [data, ...prev]);
      return { success: true, data };
    } catch (error: any) {
      console.error('Error adding movement:', error);
      return { success: false, error: error.message };
    }
  };

  // Calculate current balance
  const currentBalance = currentCash
    ? currentCash.opening_amount +
      totalSalesToday +
      movements.filter(m => m.type === 'supply').reduce((acc, m) => acc + m.amount, 0) -
      movements.filter(m => m.type === 'withdrawal').reduce((acc, m) => acc + m.amount, 0)
    : 0;

  return {
    currentCash,
    movements,
    isLoading,
    totalSalesToday,
    currentBalance,
    openCash,
    closeCash,
    addMovement,
    refresh: fetchCurrentCash,
  };
}
