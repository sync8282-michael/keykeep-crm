import { useState, useCallback } from 'react';
import { useSettings } from './useSettings';
import { db, Client } from '@/db/database';
import { toast } from '@/hooks/use-toast';
import { format, parseISO, differenceInYears } from 'date-fns';

interface EmailTemplate {
  subject: string;
  html: string;
}

export function useResendEmail() {
  const { settings } = useSettings();
  const [isSending, setIsSending] = useState(false);

  const generateAnniversaryEmail = useCallback((client: Client): EmailTemplate => {
    const moveDate = parseISO(client.moveInDate);
    const years = differenceInYears(new Date(), moveDate);
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
          <div>at ${client.address}</div>
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
  }, []);

  const sendAnniversaryEmail = useCallback(async (client: Client) => {
    if (!settings?.resendApiKey) {
      toast({
        title: "API Key Missing",
        description: "Please add your Resend API key in Settings.",
        variant: "destructive",
      });
      return false;
    }

    if (!client.email || !client.optInEmail) {
      toast({
        title: "Cannot Send Email",
        description: client.email ? "Client has not opted in to emails." : "No email address on file.",
        variant: "destructive",
      });
      return false;
    }

    setIsSending(true);
    try {
      const template = generateAnniversaryEmail(client);

      // Note: This would typically go through an edge function for security
      // For now, we'll show how to call the Resend API
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'KeyKeep Pro <onboarding@resend.dev>', // Replace with verified domain
          to: [client.email],
          subject: template.subject,
          html: template.html,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send email');
      }

      toast({
        title: "Email Sent!",
        description: `Anniversary email sent to ${client.name}.`,
      });
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      toast({
        title: "Email Failed",
        description: error instanceof Error ? error.message : "Could not send anniversary email.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSending(false);
    }
  }, [settings?.resendApiKey, generateAnniversaryEmail]);

  const sendBulkAnniversaryEmails = useCallback(async (clients: Client[]) => {
    const eligibleClients = clients.filter(c => c.email && c.optInEmail);
    
    if (eligibleClients.length === 0) {
      toast({
        title: "No Eligible Clients",
        description: "No clients with email opt-in found.",
        variant: "destructive",
      });
      return;
    }

    let successCount = 0;
    for (const client of eligibleClients) {
      const success = await sendAnniversaryEmail(client);
      if (success) successCount++;
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    toast({
      title: "Bulk Send Complete",
      description: `Sent ${successCount} of ${eligibleClients.length} emails.`,
    });
  }, [sendAnniversaryEmail]);

  return {
    isSending,
    sendAnniversaryEmail,
    sendBulkAnniversaryEmails,
    generateAnniversaryEmail,
  };
}
