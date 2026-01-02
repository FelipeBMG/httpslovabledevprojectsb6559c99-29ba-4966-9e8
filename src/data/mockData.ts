import { 
  Client, 
  Pet, 
  GroomingAppointment, 
  HotelBooking, 
  Plan, 
  Sale,
  WhatsAppConversation,
  WhatsAppMessage,
  DashboardStats 
} from '@/types';

// Mock Clients
export const mockClients: Client[] = [
  {
    id: '1',
    name: 'Maria Silva',
    whatsapp: '11999887766',
    email: 'maria@email.com',
    createdAt: new Date('2024-01-15'),
    lastInteraction: new Date('2024-12-28'),
    lastPurchase: new Date('2024-12-20'),
  },
  {
    id: '2',
    name: 'João Santos',
    whatsapp: '11988776655',
    createdAt: new Date('2024-02-20'),
    lastInteraction: new Date('2024-12-30'),
    lastPurchase: new Date('2024-12-28'),
  },
  {
    id: '3',
    name: 'Ana Oliveira',
    whatsapp: '11977665544',
    email: 'ana@email.com',
    createdAt: new Date('2024-03-10'),
    lastInteraction: new Date('2024-10-15'),
    lastPurchase: new Date('2024-09-30'),
  },
  {
    id: '4',
    name: 'Carlos Mendes',
    whatsapp: '11966554433',
    createdAt: new Date('2024-04-05'),
    lastInteraction: new Date('2024-08-20'),
    lastPurchase: new Date('2024-08-15'),
  },
];

// Mock Pets
export const mockPets: Pet[] = [
  {
    id: '1',
    clientId: '1',
    name: 'Thor',
    species: 'cachorro',
    breed: 'Golden Retriever',
    furType: 'longo',
    weight: 32,
  },
  {
    id: '2',
    clientId: '1',
    name: 'Luna',
    species: 'gato',
    breed: 'Persa',
    furType: 'muito_peludo',
    weight: 4.5,
  },
  {
    id: '3',
    clientId: '2',
    name: 'Max',
    species: 'cachorro',
    breed: 'Bulldog Francês',
    furType: 'curto',
    weight: 12,
  },
  {
    id: '4',
    clientId: '3',
    name: 'Bella',
    species: 'cachorro',
    breed: 'Poodle',
    furType: 'medio',
    weight: 8,
  },
  {
    id: '5',
    clientId: '4',
    name: 'Rex',
    species: 'cachorro',
    breed: 'Pastor Alemão',
    furType: 'medio',
    weight: 35,
  },
];

// Mock Grooming Appointments
const today = new Date();
const getDateOffset = (days: number) => {
  const date = new Date(today);
  date.setDate(date.getDate() + days);
  return date;
};

export const mockGroomingAppointments: GroomingAppointment[] = [
  {
    id: '1',
    clientId: '1',
    petId: '1',
    service: 'banho_tosa',
    status: 'agendado',
    scheduledAt: new Date(today.setHours(9, 0)),
    price: 120,
  },
  {
    id: '2',
    clientId: '2',
    petId: '3',
    service: 'banho',
    status: 'em_atendimento',
    scheduledAt: new Date(today.setHours(10, 30)),
    price: 60,
  },
  {
    id: '3',
    clientId: '1',
    petId: '2',
    service: 'banho',
    status: 'pronto',
    scheduledAt: new Date(today.setHours(11, 0)),
    price: 50,
  },
  {
    id: '4',
    clientId: '3',
    petId: '4',
    service: 'banho_tosa',
    status: 'agendado',
    scheduledAt: getDateOffset(1),
    price: 80,
  },
  {
    id: '5',
    clientId: '4',
    petId: '5',
    service: 'banho',
    status: 'agendado',
    scheduledAt: getDateOffset(2),
    price: 90,
  },
];

// Mock Hotel Bookings
export const mockHotelBookings: HotelBooking[] = [
  {
    id: '1',
    clientId: '1',
    petId: '1',
    checkIn: getDateOffset(-2),
    checkOut: getDateOffset(3),
    dailyRate: 80,
    totalPrice: 400,
    status: 'hospedado',
  },
  {
    id: '2',
    clientId: '2',
    petId: '3',
    checkIn: getDateOffset(1),
    checkOut: getDateOffset(5),
    dailyRate: 60,
    totalPrice: 240,
    status: 'reservado',
  },
  {
    id: '3',
    clientId: '3',
    petId: '4',
    checkIn: getDateOffset(-5),
    checkOut: getDateOffset(-1),
    dailyRate: 70,
    totalPrice: 280,
    status: 'check_out',
  },
];

// Mock Plans
export const mockPlans: Plan[] = [
  {
    id: '1',
    clientId: '1',
    type: 'plano_8',
    totalBaths: 8,
    usedBaths: 3,
    remainingBaths: 5,
    validUntil: getDateOffset(60),
    price: 400,
    createdAt: new Date('2024-11-01'),
  },
  {
    id: '2',
    clientId: '2',
    type: 'plano_4',
    totalBaths: 4,
    usedBaths: 4,
    remainingBaths: 0,
    validUntil: getDateOffset(-5),
    price: 220,
    createdAt: new Date('2024-10-15'),
  },
];

// Mock Sales
export const mockSales: Sale[] = [
  {
    id: '1',
    clientId: '1',
    type: 'banho',
    description: 'Banho + Tosa - Thor',
    amount: 120,
    paymentMethod: 'pix',
    issueNF: false,
    createdAt: new Date(),
  },
  {
    id: '2',
    clientId: '2',
    type: 'plano',
    description: 'Plano 4 banhos',
    amount: 220,
    paymentMethod: 'credito',
    issueNF: true,
    createdAt: getDateOffset(-1),
  },
];

// Mock WhatsApp Conversations
export const mockConversations: WhatsAppConversation[] = [
  {
    id: '1',
    clientId: '1',
    clientName: 'Maria Silva',
    clientWhatsapp: '11999887766',
    status: 'ia_ativa',
    lastMessage: 'Olá! Gostaria de agendar um banho para o Thor',
    lastMessageAt: new Date(Date.now() - 5 * 60 * 1000),
    unreadCount: 2,
  },
  {
    id: '2',
    clientId: '2',
    clientName: 'João Santos',
    clientWhatsapp: '11988776655',
    status: 'humano_ativo',
    lastMessage: 'Perfeito, confirmo o horário das 14h',
    lastMessageAt: new Date(Date.now() - 15 * 60 * 1000),
    unreadCount: 0,
  },
  {
    id: '3',
    clientId: '3',
    clientName: 'Ana Oliveira',
    clientWhatsapp: '11977665544',
    status: 'ia_ativa',
    lastMessage: 'Qual o valor do plano mensal?',
    lastMessageAt: new Date(Date.now() - 30 * 60 * 1000),
    unreadCount: 1,
  },
];

// Mock WhatsApp Messages
export const mockMessages: WhatsAppMessage[] = [
  {
    id: '1',
    clientId: '1',
    direction: 'incoming',
    content: 'Olá! Gostaria de agendar um banho para o Thor',
    source: 'humano',
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
  },
  {
    id: '2',
    clientId: '1',
    direction: 'outgoing',
    content: 'Olá Maria! 🐾 Temos horário disponível hoje às 14h ou amanhã às 10h. Qual prefere?',
    source: 'ia',
    timestamp: new Date(Date.now() - 9 * 60 * 1000),
  },
  {
    id: '3',
    clientId: '1',
    direction: 'incoming',
    content: 'Pode ser hoje às 14h!',
    source: 'humano',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
  },
];

// Mock Dashboard Stats
export const mockDashboardStats: DashboardStats = {
  todayAppointments: 8,
  activeHotelGuests: 3,
  pendingMessages: 5,
  monthlyRevenue: 12450,
  appointmentsTrend: 12,
  hotelTrend: -5,
  messagesTrend: 23,
  revenueTrend: 18,
};
