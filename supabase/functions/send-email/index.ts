import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface EmailRequest {
  clientId: string;
  templateType: 'anniversary' | 'birthday' | 'custom';
  customSubject?: string;
  customHtml?: string;
}

interface Client {
  id: string;
  name: string;
  email: string | null;
  address?: string;
  moveInDate?: string;
  birthday?: string;
  optInEmail?: boolean;
}

function generateAnniversaryEmail(client: Client): { subject: string; html: string } {
  const moveDate = client.moveInDate ? new Date(client.moveInDate) : new Date();
  const now = new Date();
  const years = Math.floor((now.getTime() - moveDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  const yearWord = years === 1 ? 'year' : 'years';

  return {
    subject: `Happy ${years}-Year Home Anniversary, ${client.name.split(' ')[0]}! 🏠`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1D2334;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .card {
      background: #ffffff;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .emoji {
      font-size: 48px;
      margin-bottom: 16px;
    }
    h1 {
      color: #1D2334;
      font-size: 28px;
      margin: 0 0 8px 0;
    }
    .subtitle {
      color: #6B7280;
      font-size: 16px;
    }
    .content {
      margin: 30px 0;
    }
    .highlight {
      background: linear-gradient(135deg, #F7CA98 0%, #AA6637 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      margin: 24px 0;
    }
    .highlight-text {
      font-size: 24px;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
      color: #9CA3AF;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="emoji">🏠🎉</div>
        <h1>Happy Home Anniversary!</h1>
        <p class="subtitle">Celebrating your special day</p>
      </div>
      
      <div class="content">
        <p>Dear ${client.name},</p>
        
        <p>Congratulations on your <strong>${years}-${yearWord} home anniversary</strong>!</p>
        
        <div class="highlight">
          <div class="highlight-text">${years} ${yearWord.charAt(0).toUpperCase() + yearWord.slice(1)}</div>
          <div>at ${client.address || 'your home'}</div>
        </div>
        
        <p>It's been an absolute pleasure being part of your homeownership journey. I hope your home has brought you countless wonderful memories!</p>
        
        <p>If you ever need anything—whether it's advice on your current home or exploring new opportunities—please don't hesitate to reach out. I'm always here to help!</p>
        
        <p>Wishing you many more happy years in your home! 🏡</p>
        
        <p>Warm regards,<br>Your Real Estate Agent</p>
      </div>
      
      <div class="footer">
        <p>Sent with ❤️ from KeyKeep Pro</p>
      </div>
    </div>
  </div>
</body>
</html>
    `,
  };
}

function generateBirthdayEmail(client: Client): { subject: string; html: string } {
  return {
    subject: `Happy Birthday, ${client.name.split(' ')[0]}! 🎂`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1D2334;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .card {
      background: #ffffff;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .emoji {
      font-size: 48px;
      margin-bottom: 16px;
    }
    h1 {
      color: #1D2334;
      font-size: 28px;
      margin: 0 0 8px 0;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
      color: #9CA3AF;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="emoji">🎂🎉</div>
        <h1>Happy Birthday!</h1>
      </div>
      
      <div class="content">
        <p>Dear ${client.name},</p>
        
        <p>Wishing you a wonderful birthday filled with joy and happiness!</p>
        
        <p>May this year bring you great success and beautiful new memories in your home.</p>
        
        <p>Best wishes,<br>Your Real Estate Agent</p>
      </div>
      
      <div class="footer">
        <p>Sent with ❤️ from KeyKeep Pro</p>
      </div>
    </div>
  </div>
</body>
</html>
    `,
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[send-email] No authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's auth
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('[send-email] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[send-email] Request from user:', user.id);

    // Parse and validate request body
    const body: EmailRequest = await req.json();
    
    if (!body.clientId || typeof body.clientId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid clientId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.templateType || !['anniversary', 'birthday', 'custom'].includes(body.templateType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid templateType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('[send-email] RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured. Please add RESEND_API_KEY in secrets.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch client data - the RLS policy ensures only the user's own clients are accessible
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name, email, birthday')
      .eq('id', body.clientId)
      .single();

    if (clientError || !client) {
      console.error('[send-email] Client fetch error:', clientError);
      return new Response(
        JSON.stringify({ error: 'Client not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!client.email) {
      return new Response(
        JSON.stringify({ error: 'Client has no email address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(client.email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid client email address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate email template
    let emailContent: { subject: string; html: string };
    
    switch (body.templateType) {
      case 'anniversary':
        emailContent = generateAnniversaryEmail(client as Client);
        break;
      case 'birthday':
        emailContent = generateBirthdayEmail(client as Client);
        break;
      case 'custom':
        if (!body.customSubject || !body.customHtml) {
          return new Response(
            JSON.stringify({ error: 'Custom template requires subject and html' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        // Limit custom content lengths
        if (body.customSubject.length > 200) {
          return new Response(
            JSON.stringify({ error: 'Subject too long (max 200 characters)' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (body.customHtml.length > 50000) {
          return new Response(
            JSON.stringify({ error: 'HTML content too long (max 50000 characters)' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        emailContent = { subject: body.customSubject, html: body.customHtml };
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid template type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log('[send-email] Sending email to:', client.email);

    // Send email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'KeyKeep Pro <onboarding@resend.dev>',
        to: [client.email],
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json();
      console.error('[send-email] Resend error:', errorData);
      return new Response(
        JSON.stringify({ error: errorData.message || 'Failed to send email' }),
        { status: resendResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await resendResponse.json();
    console.log('[send-email] Email sent successfully:', result);

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[send-email] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});