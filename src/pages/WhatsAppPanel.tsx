import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Bot, User, Pause, Play, Send, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { mockConversations, mockMessages, mockClients } from '@/data/mockData';
import { WhatsAppConversation, WhatsAppMessage, ConversationStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusConfig: Record<ConversationStatus, { label: string; color: string; bgColor: string }> = {
  ia_ativa: { label: 'IA Ativa', color: 'text-primary', bgColor: 'bg-primary/10' },
  humano_ativo: { label: 'Humano', color: 'text-secondary', bgColor: 'bg-secondary/10' },
  pausada: { label: 'Pausada', color: 'text-muted-foreground', bgColor: 'bg-muted' },
};

const WhatsAppPanel = () => {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<WhatsAppConversation[]>(mockConversations);
  const [messages] = useState<WhatsAppMessage[]>(mockMessages);
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(
    mockConversations[0]
  );
  const [inputMessage, setInputMessage] = useState('');

  const conversationMessages = selectedConversation
    ? messages.filter(m => m.clientId === selectedConversation.clientId)
    : [];

  const handleAssumeConversation = () => {
    if (!selectedConversation) return;

    setConversations(prev =>
      prev.map(c =>
        c.id === selectedConversation.id
          ? { ...c, status: 'humano_ativo' as ConversationStatus }
          : c
      )
    );
    setSelectedConversation({ ...selectedConversation, status: 'humano_ativo' });

    toast({
      title: "👤 Conversa Assumida",
      description: "Você assumiu o controle desta conversa. A IA está pausada.",
    });
  };

  const handlePauseAI = () => {
    if (!selectedConversation) return;

    const newStatus = selectedConversation.status === 'pausada' ? 'ia_ativa' : 'pausada';

    setConversations(prev =>
      prev.map(c =>
        c.id === selectedConversation.id
          ? { ...c, status: newStatus as ConversationStatus }
          : c
      )
    );
    setSelectedConversation({ ...selectedConversation, status: newStatus });

    toast({
      title: newStatus === 'pausada' ? "⏸️ IA Pausada" : "▶️ IA Retomada",
      description: `Webhook disparado para o n8n.`,
    });
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !selectedConversation) return;

    toast({
      title: "📤 Mensagem Enviada",
      description: "Mensagem encaminhada via API do WhatsApp.",
    });
    setInputMessage('');
  };

  return (
    <div className="p-8 h-[calc(100vh-2rem)]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-primary" />
          Painel WhatsApp
        </h1>
        <p className="text-muted-foreground mt-1">
          Monitore e responda mensagens em tempo real via API externa
        </p>
      </motion.div>

      {/* Important Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <Card className="border-0 shadow-soft bg-primary/5 border-l-4 border-l-primary">
          <CardContent className="p-4">
            <p className="text-sm">
              <strong>⚠️ Importante:</strong> Este painel apenas monitora e responde mensagens via API externa do WhatsApp. 
              Todas as mensagens são processadas pelo n8n. A IA responde primeiro, você pode assumir a qualquer momento.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100%-180px)]">
        {/* Conversation List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-0 shadow-soft h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Conversas</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100%-60px)]">
                <div className="p-3 space-y-2">
                  {conversations.map((conv) => {
                    const status = statusConfig[conv.status];
                    const isSelected = selectedConversation?.id === conv.id;

                    return (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv)}
                        className={cn(
                          "w-full p-3 rounded-xl text-left transition-all",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center font-bold",
                              isSelected ? "bg-white/20" : "bg-primary/10 text-primary"
                            )}>
                              {conv.clientName.charAt(0)}
                            </div>
                            {conv.unreadCount > 0 && (
                              <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary text-secondary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold truncate">{conv.clientName}</p>
                              <span className={cn(
                                "text-xs",
                                isSelected ? "text-white/70" : "text-muted-foreground"
                              )}>
                                {formatDistanceToNow(conv.lastMessageAt, { locale: ptBR })}
                              </span>
                            </div>
                            <p className={cn(
                              "text-sm truncate",
                              isSelected ? "text-white/80" : "text-muted-foreground"
                            )}>
                              {conv.lastMessage}
                            </p>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "mt-1 text-xs border-0",
                                isSelected ? "bg-white/20 text-white" : status.bgColor + " " + status.color
                              )}
                            >
                              {conv.status === 'ia_ativa' && <Bot className="w-3 h-3 mr-1" />}
                              {conv.status === 'humano_ativo' && <User className="w-3 h-3 mr-1" />}
                              {status.label}
                            </Badge>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* Chat Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="border-0 shadow-soft h-full flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                        {selectedConversation.clientName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold">{selectedConversation.clientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedConversation.clientWhatsapp}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePauseAI}
                        className={cn(
                          selectedConversation.status === 'pausada' && "border-success text-success"
                        )}
                      >
                        {selectedConversation.status === 'pausada' ? (
                          <>
                            <Play className="w-4 h-4 mr-1" />
                            Retomar IA
                          </>
                        ) : (
                          <>
                            <Pause className="w-4 h-4 mr-1" />
                            Pausar IA
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleAssumeConversation}
                        disabled={selectedConversation.status === 'humano_ativo'}
                        className="bg-gradient-secondary hover:opacity-90"
                      >
                        <User className="w-4 h-4 mr-1" />
                        Assumir Conversa
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 p-4 overflow-auto">
                  <div className="space-y-4">
                    {conversationMessages.map((msg, index) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                          "flex",
                          msg.direction === 'outgoing' ? "justify-end" : "justify-start"
                        )}
                      >
                        <div className={cn(
                          "max-w-[70%] p-3 rounded-2xl",
                          msg.direction === 'outgoing'
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted rounded-bl-sm"
                        )}>
                          <p className="text-sm">{msg.content}</p>
                          <div className={cn(
                            "flex items-center gap-1 mt-1 text-xs",
                            msg.direction === 'outgoing' ? "text-white/70" : "text-muted-foreground"
                          )}>
                            {msg.source === 'ia' ? (
                              <Bot className="w-3 h-3" />
                            ) : (
                              <User className="w-3 h-3" />
                            )}
                            <span>{msg.source === 'ia' ? 'IA' : 'Humano'}</span>
                            <span>•</span>
                            <span>
                              {new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>

                {/* Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite sua mensagem..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      className="bg-gradient-primary hover:opacity-90"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>Selecione uma conversa para visualizar</p>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default WhatsAppPanel;
