import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product, Employee, ClientDB, PetDB, CartItem } from '@/components/pdv/types';
import { differenceInDays } from 'date-fns';

interface ClientPlan {
  id: string;
  client_id: string;
  pet_id: string;
  total_baths: number;
  used_baths: number;
  expires_at: string;
  active: boolean;
}

interface ServicePrice {
  id: string;
  size_category: string;
  service_type: string;
  price: number;
}

const groomingTypeLabels: Record<string, string> = {
  banho: 'Banho',
  banho_tosa: 'Banho + Tosa',
  tosa_baby: 'Tosa Baby',
  tosa_higienica: 'Tosa Higiênica',
  tosa_padrao: 'Tosa Padrão',
  tosa_tesoura: 'Tosa Tesoura',
  tosa_maquina: 'Tosa Máquina',
};

export function usePDVData() {
  const [clients, setClients] = useState<ClientDB[]>([]);
  const [pets, setPets] = useState<PetDB[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clientPlans, setClientPlans] = useState<ClientPlan[]>([]);
  const [servicePrices, setServicePrices] = useState<ServicePrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [clientsRes, petsRes, productsRes, employeesRes, plansRes, pricesRes] = await Promise.all([
        supabase.from('clients').select('*').order('name'),
        supabase.from('pets').select('*').order('name'),
        (supabase as any).from('products').select('*').eq('active', true).order('name'),
        (supabase as any).from('employees').select('*').eq('active', true).order('name'),
        supabase.from('client_plans').select('*').eq('active', true).gt('expires_at', new Date().toISOString()),
        supabase.from('service_prices').select('*'),
      ]);

      if (clientsRes.data) setClients(clientsRes.data);
      if (petsRes.data) setPets(petsRes.data);
      if (productsRes.data) setProducts(productsRes.data);
      if (employeesRes.data) setEmployees(employeesRes.data);
      if (plansRes.data) setClientPlans(plansRes.data);
      if (pricesRes.data) setServicePrices(pricesRes.data);
    } catch (error) {
      console.error('Error fetching PDV data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get pending services for a specific pet
  const getPendingServicesForPet = async (clientId: string, petId: string): Promise<CartItem[]> => {
    const items: CartItem[] = [];
    const pet = pets.find(p => p.id === petId);
    if (!pet) return items;

    try {
      // Fetch pending appointments
      const { data: appointments } = await supabase
        .from('bath_grooming_appointments')
        .select('*')
        .eq('client_id', clientId)
        .eq('pet_id', petId)
        .neq('status', 'cancelado')
        .or('payment_status.is.null,payment_status.eq.pendente');

      // Check for active plan
      const activePlan = clientPlans.find(
        cp =>
          cp.pet_id === petId &&
          cp.client_id === clientId &&
          cp.active &&
          cp.used_baths < cp.total_baths &&
          new Date(cp.expires_at) > new Date()
      );

      let usedCredits = 0;
      const remainingCredits = activePlan ? activePlan.total_baths - activePlan.used_baths : 0;

      for (const apt of appointments || []) {
        let price = apt.price || 0;
        if (!price) {
          const priceMatch = servicePrices.find(
            sp => sp.size_category === pet.size && sp.service_type === (apt.grooming_type || apt.service_type)
          );
          price = priceMatch?.price || 50;
        }

        const canUseCredit = usedCredits < remainingCredits;
        if (canUseCredit) usedCredits++;

        const groomingLabel =
          apt.grooming_type
            ? groomingTypeLabels[apt.grooming_type] || apt.grooming_type
            : groomingTypeLabels[apt.service_type] || apt.service_type;

        items.push({
          id: `apt_${apt.id}`,
          type: 'service_banho',
          description: groomingLabel,
          pet_name: pet.name,
          unit_price: price,
          quantity: 1,
          discount_amount: 0,
          total_price: canUseCredit ? 0 : price,
          covered_by_plan: canUseCredit,
          source_id: apt.id,
          pet_id: pet.id,
          service_status: apt.status || 'agendado',
          commission_rate: 15, // Default grooming commission
        });
      }

      // Fetch pending hotel stays
      const { data: hotelStays } = await supabase
        .from('hotel_stays')
        .select('*')
        .eq('client_id', clientId)
        .eq('pet_id', petId)
        .neq('status', 'cancelado')
        .or('payment_status.is.null,payment_status.eq.pendente');

      for (const stay of hotelStays || []) {
        const nights = Math.max(1, differenceInDays(new Date(stay.check_out), new Date(stay.check_in)));
        const totalPrice = stay.total_price || nights * stay.daily_rate;

        items.push({
          id: `hotel_${stay.id}`,
          type: 'service_hotel',
          description: stay.is_creche ? 'Creche (Day Care)' : `Hotel - ${nights} diária${nights > 1 ? 's' : ''}`,
          pet_name: pet.name,
          unit_price: stay.daily_rate,
          quantity: nights,
          discount_amount: 0,
          total_price: totalPrice,
          covered_by_plan: false,
          source_id: stay.id,
          pet_id: pet.id,
          service_status: stay.status || 'reservado',
          commission_rate: 10, // Default hotel commission
        });
      }
    } catch (error) {
      console.error('Error fetching pending services:', error);
    }

    return items;
  };

  // Get pets for a specific client
  const getPetsForClient = (clientId: string) => pets.filter(p => p.client_id === clientId);

  // Get active plan for a pet
  const getActivePlanForPet = (clientId: string, petId: string) =>
    clientPlans.find(
      cp =>
        cp.pet_id === petId &&
        cp.client_id === clientId &&
        cp.active &&
        cp.used_baths < cp.total_baths &&
        new Date(cp.expires_at) > new Date()
    );

  // Search products
  const searchProducts = (query: string) => {
    if (!query.trim()) return products;
    const lowerQuery = query.toLowerCase();
    return products.filter(
      p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.category.toLowerCase().includes(lowerQuery) ||
        p.sku?.toLowerCase().includes(lowerQuery) ||
        p.barcode?.includes(query)
    );
  };

  // Get products by category
  const getProductsByCategory = (category: string) => products.filter(p => p.category === category);

  // Get low stock products
  const getLowStockProducts = () => products.filter(p => p.stock_quantity <= p.min_stock_quantity);

  return {
    clients,
    pets,
    products,
    employees,
    clientPlans,
    isLoading,
    refresh: fetchData,
    getPendingServicesForPet,
    getPetsForClient,
    getActivePlanForPet,
    searchProducts,
    getProductsByCategory,
    getLowStockProducts,
  };
}
