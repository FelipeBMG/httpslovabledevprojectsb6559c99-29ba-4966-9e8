import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

interface GoogleAuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  providerToken: string | null;
}

export function useGoogleAuth() {
  const { toast } = useToast();
  const [state, setState] = useState<GoogleAuthState>({
    user: null,
    session: null,
    isLoading: true,
    providerToken: null,
  });

  // Initialize auth state
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[GoogleAuth] Auth state changed:', event);
        
        setState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          providerToken: session?.provider_token ?? prev.providerToken,
          isLoading: false,
        }));

        // Save provider token to database if available
        if (session?.provider_token && session.user) {
          setTimeout(() => {
            saveProviderToken(session.provider_token!, session.provider_refresh_token);
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[GoogleAuth] Initial session:', session ? 'exists' : 'none');
      setState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        providerToken: session?.provider_token ?? null,
        isLoading: false,
      }));
    });

    return () => subscription.unsubscribe();
  }, []);

  // Save provider token to database for later use
  const saveProviderToken = async (accessToken: string, refreshToken?: string | null) => {
    try {
      console.log('[GoogleAuth] Saving provider token to database');
      
      const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString(); // 1 hour default

      // Check if tokens already exist
      const { data: existingTokens } = await supabase
        .from('google_calendar_tokens')
        .select('id')
        .limit(1);

      if (existingTokens && existingTokens.length > 0) {
        // Update existing tokens
        await supabase
          .from('google_calendar_tokens')
          .update({
            access_token: accessToken,
            refresh_token: refreshToken || undefined,
            expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingTokens[0].id);
      } else {
        // Insert new tokens
        await supabase
          .from('google_calendar_tokens')
          .insert({
            access_token: accessToken,
            refresh_token: refreshToken || '',
            expires_at: expiresAt,
          });
      }

      console.log('[GoogleAuth] Provider token saved successfully');
    } catch (error) {
      console.error('[GoogleAuth] Error saving provider token:', error);
    }
  };

  // Sign in with Google including Calendar scopes
  const signInWithGoogle = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      console.log('[GoogleAuth] Starting Google OAuth with Calendar scopes');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          scopes: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('[GoogleAuth] OAuth error:', error);
        
        // Check for provider not enabled error
        if (error.message.includes('provider is not enabled') || error.message.includes('Unsupported provider')) {
          toast({
            title: 'Provider Google não habilitado',
            description: 'O provider Google precisa estar habilitado no Supabase. Verifique as configurações de autenticação.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Erro na autenticação',
            description: error.message,
            variant: 'destructive',
          });
        }
        return { error };
      }

      console.log('[GoogleAuth] OAuth initiated successfully');
      return { data, error: null };
    } catch (error) {
      console.error('[GoogleAuth] Unexpected error:', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
      return { error };
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [toast]);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: 'Erro ao sair',
          description: error.message,
          variant: 'destructive',
        });
        return { error };
      }

      setState({
        user: null,
        session: null,
        providerToken: null,
        isLoading: false,
      });

      toast({
        title: 'Desconectado',
        description: 'Você saiu da sua conta Google.',
      });

      return { error: null };
    } catch (error) {
      console.error('[GoogleAuth] Sign out error:', error);
      return { error };
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [toast]);

  // Check if has valid Calendar token
  const hasCalendarAccess = useCallback(() => {
    return !!state.providerToken || !!state.session?.provider_token;
  }, [state.providerToken, state.session]);

  return {
    user: state.user,
    session: state.session,
    isLoading: state.isLoading,
    isAuthenticated: !!state.user,
    providerToken: state.providerToken || state.session?.provider_token,
    hasCalendarAccess: hasCalendarAccess(),
    signInWithGoogle,
    signOut,
  };
}
