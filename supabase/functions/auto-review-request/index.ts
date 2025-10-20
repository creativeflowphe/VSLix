import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { type, record } = await req.json();

    if (type !== 'UPDATE' || !record) {
      return new Response(
        JSON.stringify({ message: 'Not a relevant event' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (record.status === 'completed' && record.payment_status === 'paid') {
      const existingRequest = await supabase
        .from('review_requests')
        .select('id')
        .eq('booking_id', record.id)
        .maybeSingle();

      if (!existingRequest.data) {
        const { data: reviewRequest, error: requestError } = await supabase
          .from('review_requests')
          .insert({
            salon_id: record.salon_id,
            booking_id: record.id,
            user_id: record.client_id,
            status: 'pending',
          })
          .select()
          .single();

        if (requestError) {
          throw requestError;
        }

        const { data: booking } = await supabase
          .from('bookings')
          .select(`
            *,
            salons!inner(name),
            users!inner(email, full_name)
          `)
          .eq('id', record.id)
          .maybeSingle();

        if (booking) {
          const reviewUrl = `${supabaseUrl}/review/${reviewRequest.token}`;
          
          console.log(`Review request created for booking ${record.id}`);
          console.log(`Review URL: ${reviewUrl}`);
          console.log(`Customer: ${booking.users.email}`);

          const notificationContent = `Hi ${booking.users.full_name},\n\nThank you for visiting ${booking.salons.name}! We hope you enjoyed your experience.\n\nWe'd love to hear your feedback. Please take a moment to leave us a review:\n${reviewUrl}\n\nThank you!`;

          await supabase
            .from('notifications_log')
            .insert({
              salon_id: record.salon_id,
              booking_id: record.id,
              user_id: record.client_id,
              type: 'email',
              recipient: booking.users.email,
              subject: `How was your visit to ${booking.salons.name}?`,
              content: notificationContent,
              status: 'pending',
              metadata: { review_request_id: reviewRequest.id },
            });

          await supabase
            .from('review_requests')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', reviewRequest.id);
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Review request created and notification sent',
            reviewRequest,
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ message: 'No action needed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error processing review request:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});