import { motion } from 'framer-motion';
import { Calendar, Scissors, Home, DollarSign, MessageSquare, Bell } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { AppointmentList } from '@/components/dashboard/AppointmentList';
import { RecentMessages } from '@/components/dashboard/RecentMessages';
import { 
  mockDashboardStats, 
  mockGroomingAppointments, 
  mockConversations,
  mockHotelBookings 
} from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const { toast } = useToast();
  const stats = mockDashboardStats;
  const todayAppointments = mockGroomingAppointments.filter(
    apt => apt.status !== 'finalizado'
  ).slice(0, 4);
  const activeHotelGuests = mockHotelBookings.filter(b => b.status === 'hospedado');

  const handlePetReady = (appointmentId: string) => {
    toast({
      title: "🎉 Pet Pronto!",
      description: "Webhook disparado para o n8n. WhatsApp será enviado ao cliente.",
    });
  };

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
            <h1 className="text-3xl font-display font-bold text-foreground">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Bem-vindo ao seu painel de controle
            </p>
          </div>
          <Button className="bg-gradient-primary hover:opacity-90">
            <Bell className="w-4 h-4 mr-2" />
            Notificações
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Atendimentos Hoje"
          value={stats.todayAppointments}
          trend={stats.appointmentsTrend}
          icon={Scissors}
          variant="primary"
        />
        <StatCard
          title="Hóspedes Ativos"
          value={stats.activeHotelGuests}
          trend={stats.hotelTrend}
          icon={Home}
          variant="secondary"
        />
        <StatCard
          title="Mensagens Pendentes"
          value={stats.pendingMessages}
          trend={stats.messagesTrend}
          icon={MessageSquare}
          variant="warning"
        />
        <StatCard
          title="Faturamento Mensal"
          value={`R$ ${stats.monthlyRevenue.toLocaleString('pt-BR')}`}
          trend={stats.revenueTrend}
          icon={DollarSign}
          variant="success"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments */}
        <Card className="lg:col-span-2 border-0 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Atendimentos de Hoje
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-primary">
              Ver todos
            </Button>
          </CardHeader>
          <CardContent>
            <AppointmentList 
              appointments={todayAppointments}
              onPetReady={handlePetReady}
            />
          </CardContent>
        </Card>

        {/* Recent WhatsApp Messages */}
        <Card className="border-0 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              WhatsApp
            </CardTitle>
            <span className="bg-secondary text-secondary-foreground text-xs font-bold px-2 py-1 rounded-full">
              {mockConversations.reduce((acc, c) => acc + c.unreadCount, 0)} novas
            </span>
          </CardHeader>
          <CardContent>
            <RecentMessages conversations={mockConversations.slice(0, 3)} />
          </CardContent>
        </Card>
      </div>

      {/* Hotel Quick View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6"
      >
        <Card className="border-0 shadow-soft bg-gradient-hero text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">🏨 Hotelzinho</h3>
                <p className="text-white/80">
                  {activeHotelGuests.length} pet{activeHotelGuests.length !== 1 ? 's' : ''} hospedado{activeHotelGuests.length !== 1 ? 's' : ''} agora
                </p>
              </div>
              <div className="flex -space-x-2">
                {activeHotelGuests.slice(0, 3).map((guest, i) => (
                  <div 
                    key={guest.id}
                    className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-lg border-2 border-white/30"
                  >
                    🐕
                  </div>
                ))}
                {activeHotelGuests.length > 3 && (
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold border-2 border-white/30">
                    +{activeHotelGuests.length - 3}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard;
