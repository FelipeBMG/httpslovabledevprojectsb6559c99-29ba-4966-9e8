import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  colorId?: string;
  location?: string;
}

export function useCalendarEvents() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Get valid access token (from session or refresh)
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      // First try to get from current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.provider_token) {
        console.log('[Calendar] Using provider token from session');
        return session.provider_token;
      }

      // Fallback: try to get from database and refresh if needed
      console.log('[Calendar] Checking database for token');
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-auth?action=check-connection`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      
      if (!result.connected && result.hasTokens) {
        // Token expired, try to refresh
        console.log('[Calendar] Token expired, refreshing...');
        const refreshResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-auth?action=refresh-token`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const refreshResult = await refreshResponse.json();
        if (refreshResult.access_token) {
          return refreshResult.access_token;
        }
      }

      return null;
    } catch (error) {
      console.error('[Calendar] Error getting access token:', error);
      return null;
    }
  }, []);

  // Create event using Edge Function
  const createEvent = useCallback(async (
    event: CalendarEvent,
    calendarId: string = 'primary'
  ): Promise<CalendarEvent | null> => {
    try {
      setIsLoading(true);
      console.log('[Calendar] Creating event:', event.summary);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'create-event',
            calendarId,
            event,
          }),
        }
      );

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      console.log('[Calendar] Event created successfully:', result.event?.id);
      
      toast({
        title: '✅ Evento Criado!',
        description: `"${event.summary}" foi adicionado ao Google Calendar.`,
      });

      return result.event;
    } catch (error) {
      console.error('[Calendar] Error creating event:', error);
      toast({
        title: 'Erro ao criar evento',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // List events
  const listEvents = useCallback(async (
    calendarId: string = 'primary',
    timeMin?: string,
    timeMax?: string
  ): Promise<CalendarEvent[]> => {
    try {
      setIsLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'list-events',
            calendarId,
            timeMin,
            timeMax,
          }),
        }
      );

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      return result.events || [];
    } catch (error) {
      console.error('[Calendar] Error listing events:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update event
  const updateEvent = useCallback(async (
    eventId: string,
    event: CalendarEvent,
    calendarId: string = 'primary'
  ): Promise<CalendarEvent | null> => {
    try {
      setIsLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'update-event',
            calendarId,
            eventId,
            event,
          }),
        }
      );

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: '✅ Evento Atualizado!',
        description: `"${event.summary}" foi atualizado no Google Calendar.`,
      });

      return result.event;
    } catch (error) {
      console.error('[Calendar] Error updating event:', error);
      toast({
        title: 'Erro ao atualizar evento',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Delete event
  const deleteEvent = useCallback(async (
    eventId: string,
    calendarId: string = 'primary'
  ): Promise<boolean> => {
    try {
      setIsLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'delete-event',
            calendarId,
            eventId,
          }),
        }
      );

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: '🗑️ Evento Excluído',
        description: 'O evento foi removido do Google Calendar.',
      });

      return true;
    } catch (error) {
      console.error('[Calendar] Error deleting event:', error);
      toast({
        title: 'Erro ao excluir evento',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    isLoading,
    getAccessToken,
    createEvent,
    listEvents,
    updateEvent,
    deleteEvent,
  };
}
