import { motion } from 'framer-motion';
import { WhatsAppConversation } from '@/types';
import { MessageSquare, Bot, User, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RecentMessagesProps {
  conversations: WhatsAppConversation[];
  onSelectConversation?: (id: string) => void;
}

const statusConfig = {
  ia_ativa: { icon: Bot, label: 'IA respondendo', color: 'text-primary' },
  humano_ativo: { icon: User, label: 'Humano ativo', color: 'text-secondary' },
  pausada: { icon: Circle, label: 'Pausada', color: 'text-muted-foreground' },
};

export function RecentMessages({ conversations, onSelectConversation }: RecentMessagesProps) {
  return (
    <div className="space-y-2">
      {conversations.map((conv, index) => {
        const status = statusConfig[conv.status];
        const StatusIcon = status.icon;

        return (
          <motion.div
            key={conv.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSelectConversation?.(conv.id)}
            className="p-4 bg-card rounded-xl border border-border hover:shadow-soft hover:border-primary/30 transition-all cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                {conv.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary text-secondary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-foreground truncate">{conv.clientName}</h4>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(conv.lastMessageAt, { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                <div className="flex items-center gap-1 mt-2">
                  <StatusIcon className={cn("w-3 h-3", status.color)} />
                  <span className={cn("text-xs", status.color)}>{status.label}</span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
