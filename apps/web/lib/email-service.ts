/**
 * Transactional Email Service (Resend Integration)
 * 
 * Manages transactional notifications (bridal enquiries, order confirmations).
 * Uses zero-dependency native fetch to https://api.resend.com/emails.
 * Respects sandbox environments and strictly prevents unsolicited email dispatch during tests.
 * 
 * Explicit Delivery Statuses:
 * - SIMULATED: Development/test mock log (no network calls, key unconfigured).
 * - ACCEPTED_BY_PROVIDER: HTTP 200 from Resend API (queued by provider, not proof of inbox delivery).
 * - FAILED: API error, network failure, or timeout.
 * - UNCONFIGURED: Provider credentials completely missing.
 */

export interface EnquiryEmailPayload {
  enquiryNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  eventType: string;
  eventDate?: string;
  bangleSize?: string;
  notes: string;
  receivedAt: string;
}

export type EmailDeliveryStatus = 'SIMULATED' | 'ACCEPTED_BY_PROVIDER' | 'FAILED' | 'UNCONFIGURED';

export interface EmailDispatchResult {
  success: boolean;
  status: EmailDeliveryStatus;
  messageId?: string;
  error?: string;
}

export class EmailService {
  /**
   * Checks whether a genuine Resend API key is configured.
   */
  static isConfigured(): boolean {
    const key = process.env.RESEND_API_KEY;
    return Boolean(
      key &&
      key.trim() !== '' &&
      !key.includes('placeholder') &&
      key.startsWith('re_')
    );
  }

  /**
   * Sends or simulates bridal consultation enquiry notification to the atelier.
   */
  static async sendEnquiryNotification(
    enquiry: EnquiryEmailPayload
  ): Promise<EmailDispatchResult> {
    const isConfigured = this.isConfigured();

    // In test or unconfigured environments: simulate delivery safely without external network calls
    if (!isConfigured) {
      console.log(
        `[EmailService:Simulated] Notification logged for Enquiry ${enquiry.enquiryNumber} (Customer: ${enquiry.customerName}, Phone: ${enquiry.customerPhone.slice(0, 4)}***)`
      );
      return {
        success: true,
        status: 'SIMULATED',
        messageId: `sim_${enquiry.enquiryNumber}_${Date.now()}`,
      };
    }

    const apiKey = process.env.RESEND_API_KEY!;
    const fromAddress = process.env.EMAIL_FROM || 'NAVA Atelier <onboarding@resend.dev>';
    const studioNotificationEmail =
      process.env.STUDIO_NOTIFICATION_EMAIL || 'orders@navacreations.in';

    const emailHtml = `
      <div style="font-family: serif; color: #1c1917; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e7e5e4; border-radius: 8px;">
        <h2 style="color: #6d1a24; border-bottom: 2px solid #b89758; padding-bottom: 8px;">
          Bespoke Bridal Enquiry: ${enquiry.enquiryNumber}
        </h2>
        <p style="font-size: 14px; line-height: 1.6;">
          A new bespoke bridal jewellery consultation request has been submitted through the NAVA CREATIONS online storefront.
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 20px 0;">
          <tr style="border-bottom: 1px solid #f5f5f4;"><td style="padding: 8px; font-weight: bold;">Client Name</td><td style="padding: 8px;">${enquiry.customerName}</td></tr>
          <tr style="border-bottom: 1px solid #f5f5f4;"><td style="padding: 8px; font-weight: bold;">Contact Phone</td><td style="padding: 8px;">${enquiry.customerPhone}</td></tr>
          ${enquiry.customerEmail ? `<tr style="border-bottom: 1px solid #f5f5f4;"><td style="padding: 8px; font-weight: bold;">Email</td><td style="padding: 8px;">${enquiry.customerEmail}</td></tr>` : ''}
          <tr style="border-bottom: 1px solid #f5f5f4;"><td style="padding: 8px; font-weight: bold;">Celebration Event</td><td style="padding: 8px;">${enquiry.eventType}</td></tr>
          ${enquiry.eventDate ? `<tr style="border-bottom: 1px solid #f5f5f4;"><td style="padding: 8px; font-weight: bold;">Target Event Date</td><td style="padding: 8px;">${enquiry.eventDate}</td></tr>` : ''}
          <tr style="border-bottom: 1px solid #f5f5f4;"><td style="padding: 8px; font-weight: bold;">Bangle Sizing</td><td style="padding: 8px;">${enquiry.bangleSize || 'Not specified'}</td></tr>
        </table>
        <div style="background-color: #fafaf9; border-left: 4px solid #6d1a24; padding: 12px 16px; margin: 20px 0;">
          <strong>Design &amp; Outfit Notes:</strong>
          <p style="font-size: 13px; margin-top: 6px; white-space: pre-wrap;">${enquiry.notes}</p>
        </div>
        <p style="font-size: 11px; color: #78716c; margin-top: 24px;">
          Received at: ${enquiry.receivedAt} IST &bull; Bengaluru Atelier Consultation Queue
        </p>
      </div>
    `;

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [studioNotificationEmail],
          subject: `[Bridal Enquiry] ${enquiry.customerName} - ${enquiry.eventType} (${enquiry.enquiryNumber})`,
          html: emailHtml,
        }),
        signal: AbortSignal.timeout(6000),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMessage = errorData.message || `Resend API HTTP ${response.status}`;
        console.error(`[EmailService] Resend dispatch failed: ${errMessage}`);
        return {
          success: false,
          status: 'FAILED',
          error: errMessage,
        };
      }

      const data = await response.json();
      return {
        success: true,
        status: 'ACCEPTED_BY_PROVIDER',
        messageId: data.id,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[EmailService] Network error during dispatch: ${message}`);
      return {
        success: false,
        status: 'FAILED',
        error: message,
      };
    }
  }
}
