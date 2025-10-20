import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface NotificationRequest {
  type: 'email' | 'sms' | 'whatsapp';
  recipient: string;
  subject?: string;
  content: string;
  templateId?: string;
  bookingId?: string;
  metadata?: Record<string, any>;
}

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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const { type, recipient, subject, content, templateId, bookingId, metadata }: NotificationRequest = await req.json();

    if (!type || !recipient || !content) {
      throw new Error('Missing required fields: type, recipient, content');
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!userData) {
      throw new Error('User not found');
    }

    let finalContent = content;
    let finalSubject = subject;

    if (templateId) {
      const { data: template } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('id', templateId)
        .eq('is_active', true)
        .maybeSingle();

      if (template) {
        finalContent = template.content;
        finalSubject = template.subject;
        
        if (metadata) {
          Object.keys(metadata).forEach(key => {
            finalContent = finalContent.replace(new RegExp(`{{${key}}}`, 'g'), metadata[key]);
            if (finalSubject) {
              finalSubject = finalSubject.replace(new RegExp(`{{${key}}}`, 'g'), metadata[key]);
            }
          });
        }
      }
    }

    let status = 'sent';
    let error = null;
    let sentAt = new Date().toISOString();

    try {
      if (type === 'email') {
        console.log(`Sending email to ${recipient} with subject: ${finalSubject}`);
      } else if (type === 'sms' || type === 'whatsapp') {
        console.log(`Sending ${type} to ${recipient}`);
      }
    } catch (sendError: any) {
      status = 'failed';
      error = sendError.message;
      sentAt = null;
    }

    const { data: notification, error: insertError } = await supabase
      .from('notifications_log')
      .insert({
        salon_id: metadata?.salon_id,
        booking_id: bookingId,
        user_id: user.id,
        type,
        template_id: templateId,
        recipient,
        subject: finalSubject,
        content: finalContent,
        status,
        sent_at: sentAt,
        error,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        notification,
        message: `Notification ${status}`,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Error sending notification:', error);
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