import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import BanhoTosa from "./pages/BanhoTosa";
import HotelCreche from "./pages/HotelCreche";
import Planos from "./pages/Planos";
import Clientes from "./pages/Clientes";
import Lembretes from "./pages/Lembretes";
import Inativos from "./pages/Inativos";
import FrenteCaixa from "./pages/FrenteCaixa";
import WhatsAppPanel from "./pages/WhatsAppPanel";
import Importar from "./pages/Importar";
import TabelaValores from "./pages/TabelaValores";
import ServicosDoDia from "./pages/ServicosDoDia";
import RotaDoDia from "./pages/RotaDoDia";
import Faturamento from "./pages/Faturamento";
import Estoque from "./pages/Estoque";
import NotFound from "./pages/NotFound";

// Feature flags - Fiscal module is DISABLED
// ConfiguracoesFiscais and NotasFiscais are removed from routes
// A emissão de documentos fiscais para clientes finais é de responsabilidade 
// do pet shop e não faz parte deste plano no momento.

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/banho-tosa" element={<BanhoTosa />} />
            <Route path="/hotel-creche" element={<HotelCreche />} />
            <Route path="/planos" element={<Planos />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/lembretes" element={<Lembretes />} />
            <Route path="/inativos" element={<Inativos />} />
            <Route path="/caixa" element={<FrenteCaixa />} />
            <Route path="/whatsapp" element={<WhatsAppPanel />} />
            <Route path="/importar" element={<Importar />} />
            <Route path="/tabela-valores" element={<TabelaValores />} />
            <Route path="/servicos-do-dia" element={<ServicosDoDia />} />
            <Route path="/rota-do-dia" element={<RotaDoDia />} />
            <Route path="/faturamento" element={<Faturamento />} />
            <Route path="/estoque" element={<Estoque />} />
            {/* Fiscal routes DISABLED via feature flag */}
            {/* <Route path="/config-fiscal" element={<ConfiguracoesFiscais />} /> */}
            {/* <Route path="/notas-fiscais" element={<NotasFiscais />} /> */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
