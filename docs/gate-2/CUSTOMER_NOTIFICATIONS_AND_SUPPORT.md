# NAVA CREATIONS — CUSTOMER NOTIFICATIONS, COMMUNICATIONS & CONCIERGE SUPPORT
**Document ID:** `DOC-G2-PHASE7-COMMUNICATIONS`  
**Generated At:** 2026-11-15T09:55:35+05:30  
**Repository:** `D:\NAVA`  
**Branch:** `feature/production-readiness`  
**Role:** Customer Experience Architect & Communications Systems Engineer  

---

## 1. MULTI-CHANNEL COMMUNICATION STRATEGY

For bespoke Indian bridal jewellery and artisanal bangles, customer communication is not simply an administrative confirmation—it is a core touchpoint that builds trust and eliminates wedding deadline anxiety. The platform adopts a three-tier notification strategy:

```
                                  [ CUSTOMER LIFECYCLE EVENT ]
                                                |
                 +------------------------------+------------------------------+
                 |                              |                              |
                 v                              v                              v
      +---------------------+        +---------------------+        +---------------------+
      | TRANSACTIONAL EMAIL |        |  TRANSACTIONAL SMS  |        | WHATSAPP CONCIERGE  |
      | (Resend API)        |        | (TRAI DLT Registered|        | (WhatsApp Business  |
      | - Rich HTML receipt |        |  Entity)            |        |  Cloud API)         |
      | - High-res imagery  |        | - Urgent OTP alerts |        | - Bangle sizing     |
      | - Legal tax invoice |        | - Immediate delivery|        | - Custom color match|
      |   attachment        |        |   milestone SMS     |        | - Delivery dispatch |
      +---------------------+        +---------------------+        +---------------------+
```

---

## 2. PROVIDER EVALUATION & REGULATORY COMPLIANCE

### 2.1 Transactional Email: Resend vs AWS SES vs Brevo
- **Selected Provider:** **Resend**
- **Evaluation Summary:**
  - *Developer Experience & Next.js Integration:* Resend provides native React Email templates and zero-dependency HTTPS fetch dispatch (`apps/web/lib/email-service.ts`).
  - *Deliverability:* Dedicated IP options, automated DKIM/SPF/DMARC signing, and $> 99.2\%$ inbox placement rates on Gmail, Yahoo, and iCloud.
  - *Pricing:* Free tier covers up to 3,000 emails/month; Pro tier provides 50,000 emails/month for $20 (₹1,700), perfectly matching early-stage scale.

### 2.2 Indian SMS Regulatory Framework: TRAI DLT Mandates
To transmit commercial or transactional SMS in India without being blocked or fined by telecommunication operators under TRAI's TCCCPR (Telecom Commercial Communications Customer Preference Regulations):
1. **Principal Entity (PE) Registration:** Business must register on a recognized DLT portal (e.g. Jio DLT, Vilpower/Vodafone, Airtel DLT).
2. **Sender ID (Header):** Register an approved 6-character alphabetic header: `NAVACR` or `NAVABG`.
3. **Template Registration:** Every transactional template must be pre-approved with explicit variable tags `{#var#}`. Unregistered SMS strings are dropped by telecom gateways at the network layer.

### 2.3 WhatsApp Business API (WABA)
WhatsApp is the primary conversational commerce channel in India.
- **Provider:** Meta Cloud API or official Indian Business Solution Providers (Gupshup / Interakt / Wati).
- **Concierge Capabilities:** Interactive quick-reply buttons ("Confirm Bangle Size", "Track Shipment", "Speak to Stylist").

---

## 3. COMPREHENSIVE NOTIFICATION EVENT CATALOG (10 CORE EVENTS)

| Event ID | Trigger Event | Primary Channel | Secondary Channel | Template Name / Subject Line | Dynamic Variables |
|:---:|:---|:---:|:---:|:---|:---|
| **NOTIF-01** | Order Placed (Pending UPI) | WhatsApp | Email | *Order Received: Complete your UPI payment for {#var#}* | Order #, Amount, UPI VPA, QR Link |
| **NOTIF-02** | Payment Verified & Confirmed | Email | WhatsApp | *Payment Confirmed: Your NAVA Order #{#var#} is being crafted* | Order #, Item Names, Total Amount, Estimated Dispatch Date |
| **NOTIF-03** | Workshop Crafting Started | WhatsApp | — | *Artisan Update: Your bridal chuda is now in production* | Order #, Bridal Sizing Details |
| **NOTIF-04** | Order Shipped | Email | WhatsApp / SMS | *Dispatched! Track your NAVA luxury bangles #{#var#}* | Order #, Carrier, AWB Tracking URL |
| **NOTIF-05** | Out for Delivery | WhatsApp | SMS | *Out for Delivery: Your NAVA heirloom arrives today* | Order #, Delivery Agent Contact, Payment Due (if COD) |
| **NOTIF-06** | Delivered Successfully | WhatsApp | Email | *Delivered: Welcome to the NAVA family* | Order #, Care Guide Link, Review Link |
| **NOTIF-07** | Order Cancelled & Restocked | Email | WhatsApp | *Order Cancellation Update: #{#var#}* | Order #, Cancellation Reason, Refund Reference |
| **NOTIF-08** | Reservation TTL Expiry Warning | Browser / Cart | — | *Your bridal selection expires in 3 minutes* | Cart Items, Expiry Timer |
| **NOTIF-09** | Bespoke Bridal Enquiry Received | Email & WhatsApp | SMS | *Consultation Confirmed: NAVA Bridal Stylist Assigned* | Enquiry #, Customer Name, Stylist Name |
| **NOTIF-10** | Return / Exchange Update | Email | WhatsApp | *NAVA Care: Update regarding your return request* | Order #, Return Status, Pickup AWB |

---

## 4. PRIVACY, LOG SANITIZATION & PII REDACTION

Under the Indian Digital Personal Data Protection (DPDP) Act 2023, customer Personally Identifiable Information (PII) must not be logged in plain text.

### 4.1 Log Sanitization Engine
The platform runtime sanitizes all customer log entries:
```typescript
// Architectural implementation from apps/web/lib/email-service.ts
function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 10) return '***';
  return phone.slice(0, 2) + '******' + phone.slice(-2); // e.g., 98******21
}

function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return '***';
  return parts[0].slice(0, 1) + '***@' + parts[1]; // e.g., a***@gmail.com
}
```
**Verification:** In development and test runs, `EmailService` logs:
`[EMAIL SIMULATION] To: a***@gmail.com (Phone: 98******21) | Subject: Order Confirmation NAV-2026-8821`.

---

## 5. CUSTOMER SUPPORT PLAYBOOK & CONCIERGE SOPS

### 5.1 Bangle Sizing Guidance Concierge
Because bangles cannot be stretched or altered after purchase, wrist measurement errors represent a primary source of customer dissatisfaction.
- **SOP 1 (Existing Bangle Method):** Customer places their best-fitting round bangle over a flat metric ruler and measures the exact internal diameter in millimetres:
  - **Size 2.4:** Internal diameter = $57.2\text{ mm}$ ($2.25\text{ inches}$)
  - **Size 2.6:** Internal diameter = $60.3\text{ mm}$ ($2.375\text{ inches}$)
  - **Size 2.8:** Internal diameter = $63.5\text{ mm}$ ($2.50\text{ inches}$)
- **SOP 2 (Thread / Knuckle Method):** Customer wraps a non-stretchy thread or tape around the widest part of their closed hand (the knuckles, with the thumb tucked into the palm) and shares the measurement on WhatsApp for stylist verification.

### 5.2 Transit Damage Replacement Protocol
In the rare event that a courier mishandles a shipment and glass bangles break:
1. **Unboxing Video Requirement:** Customer must provide an uninterrupted video of package unboxing within 24 hours of delivery.
2. **Immediate Priority Replacement:** Customer support dispatches an express replacement set within 48 hours without waiting for courier insurance claim settlements.
