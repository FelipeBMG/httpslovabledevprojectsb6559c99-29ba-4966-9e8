import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SyncPayload {
  event_id: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const payload: SyncPayload = await req.json();
    console.log('Received sync payload:', payload);

    const { event_id, status, start_date, end_date } = payload;

    if (!event_id) {
      return new Response(
        JSON.stringify({ error: 'event_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for full access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let found = false;
    let updatedTable = '';

    // Check if event is cancelled
    const isCancelled = status?.toLowerCase() === 'cancelled' || status?.toLowerCase() === 'canceled';

    // Try to find in bath_grooming_appointments first
    const { data: bathAppointment, error: bathError } = await supabase
      .from('bath_grooming_appointments')
      .select('id')
      .eq('google_event_id', event_id)
      .maybeSingle();

    if (bathError) {
      console.error('Error searching bath_grooming_appointments:', bathError);
    }

    if (bathAppointment) {
      found = true;
      updatedTable = 'bath_grooming_appointments';

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (isCancelled) {
        updateData.status = 'cancelado';
        updateData.kanban_status = 'cancelado';
      } else {
        // Update dates if provided
        if (start_date) {
          updateData.start_datetime = start_date;
        }
        if (end_date) {
          updateData.end_datetime = end_date;
        }
      }

      const { error: updateError } = await supabase
        .from('bath_grooming_appointments')
        .update(updateData)
        .eq('id', bathAppointment.id);

      if (updateError) {
        console.error('Error updating bath_grooming_appointments:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update appointment', details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Updated bath_grooming_appointments id=${bathAppointment.id}`, updateData);
    }

    // If not found in bath, try hotel_stays
    if (!found) {
      const { data: hotelStay, error: hotelError } = await supabase
        .from('hotel_stays')
        .select('id')
        .eq('google_event_id', event_id)
        .maybeSingle();

      if (hotelError) {
        console.error('Error searching hotel_stays:', hotelError);
      }

      if (hotelStay) {
        found = true;
        updatedTable = 'hotel_stays';

        const updateData: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };

        if (isCancelled) {
          updateData.status = 'cancelado';
        } else {
          // Update dates if provided
          if (start_date) {
            updateData.check_in = start_date;
          }
          if (end_date) {
            updateData.check_out = end_date;
          }
        }

        const { error: updateError } = await supabase
          .from('hotel_stays')
          .update(updateData)
          .eq('id', hotelStay.id);

        if (updateError) {
          console.error('Error updating hotel_stays:', updateError);
          return new Response(
            JSON.stringify({ error: 'Failed to update hotel stay', details: updateError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`Updated hotel_stays id=${hotelStay.id}`, updateData);
      }
    }

    if (!found) {
      console.log(`No record found for event_id: ${event_id}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Event not found in any table',
          event_id 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: isCancelled ? 'Appointment cancelled' : 'Appointment updated',
        table: updatedTable,
        event_id 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
