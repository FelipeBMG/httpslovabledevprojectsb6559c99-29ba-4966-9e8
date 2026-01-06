// =====================================================
// PDV Types - Tipos do Sistema de Vendas
// =====================================================

export type PaymentMethod = 'dinheiro' | 'pix' | 'credito' | 'debito';
export type PaymentStatus = 'pendente' | 'pago' | 'cancelado';
export type CashRegisterStatus = 'open' | 'closed';

export interface Employee {
  id: string;
  profile_id?: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  commission_rate: number;
  active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  sku?: string;
  barcode?: string;
  cost_price: number;
  sale_price: number;
  stock_quantity: number;
  min_stock_quantity: number;
  unit: string;
  brand?: string;
  commission_rate: number;
  active: boolean;
  created_at: string;
}

export interface CashRegister {
  id: string;
  opened_by?: string;
  closed_by?: string;
  opening_amount: number;
  closing_amount?: number;
  expected_amount?: number;
  difference?: number;
  status: CashRegisterStatus;
  opened_at: string;
  closed_at?: string;
  notes?: string;
}

export interface CashMovement {
  id: string;
  cash_register_id: string;
  type: 'withdrawal' | 'supply';
  amount: number;
  reason?: string;
  performed_by?: string;
  created_at: string;
}

export interface Sale {
  id: string;
  cash_register_id?: string;
  client_id?: string;
  pet_id?: string;
  employee_id?: string;
  subtotal: number;
  discount_amount: number;
  discount_percent: number;
  tax_amount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  invoice_number?: string;
  notes?: string;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id?: string;
  product_id?: string;
  item_type: 'product' | 'service_banho' | 'service_hotel' | 'service_consulta' | 'extra';
  description: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  total_price: number;
  covered_by_plan: boolean;
  source_id?: string;
  pet_id?: string;
  commission_rate: number;
}

export interface Commission {
  id: string;
  employee_id: string;
  sale_id: string;
  sale_item_id: string;
  amount: number;
  rate: number;
  status: 'pendente' | 'pago';
  paid_at?: string;
  created_at: string;
}

// Cart item for PDV
export interface CartItem {
  id: string;
  type: SaleItem['item_type'];
  product_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  total_price: number;
  covered_by_plan: boolean;
  source_id?: string;
  pet_id?: string;
  pet_name?: string;
  commission_rate: number;
  service_status?: string;
}

// Client from database
export interface ClientDB {
  id: string;
  name: string;
  whatsapp: string;
  email?: string;
}

// Pet from database
export interface PetDB {
  id: string;
  client_id: string;
  name: string;
  species: string;
  breed?: string;
  size?: string;
  coat_type?: string;
}

// Category labels
export const categoryLabels: Record<string, string> = {
  racao: 'Ração',
  medicamento: 'Medicamento',
  higiene: 'Higiene',
  acessorio: 'Acessório',
  outros: 'Outros',
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  credito: 'Cartão de Crédito',
  debito: 'Cartão de Débito',
};
