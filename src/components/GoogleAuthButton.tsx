import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Loader2, LogOut, CheckCircle, User } from 'lucide-react';
import { useState } from 'react';

export function GoogleAuthButton() {
  const { 
    user, 
    isLoading, 
    isAuthenticated, 
    hasCalendarAccess,
    signInWithGoogle, 
    signOut 
  } = useGoogleAuth();
  
  const { createEvent, isLoading: isCreatingEvent } = useCalendarEvents();
  const [eventCreated, setEventCreated] = useState(false);

  const handleTestEvent = async () => {
    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // 30 min duration

    const event = await createEvent({
      summary: '🐾 Teste PetSaaS - Integração OK!',
      description: 'Este evento foi criado automaticamente para testar a integração com Google Calendar via Supabase Auth.',
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
    });

    if (event) {
      setEventCreated(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Verificando autenticação...</span>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{user?.email}</span>
        </div>

        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
          <Calendar className="h-3 w-3 mr-1" />
          Google Calendar Conectado
        </Badge>

        {hasCalendarAccess && !eventCreated && (
          <Button
            onClick={handleTestEvent}
            size="sm"
            variant="outline"
            disabled={isCreatingEvent}
          >
            {isCreatingEvent ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Calendar className="h-4 w-4 mr-2" />
            )}
            Criar Evento de Teste
          </Button>
        )}

        {eventCreated && (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Evento criado com sucesso!
          </Badge>
        )}

        <Button
          onClick={signOut}
          size="sm"
          variant="ghost"
          className="text-muted-foreground"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Calendar className="h-5 w-5 text-primary" />
      
      <Badge variant="secondary">
        Não autenticado
      </Badge>

      <Button
        onClick={signInWithGoogle}
        size="sm"
        variant="default"
        disabled={isLoading}
        className="bg-primary hover:bg-primary/90"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Calendar className="h-4 w-4 mr-2" />
        )}
        Entrar com Google
      </Button>
    </div>
  );
}
