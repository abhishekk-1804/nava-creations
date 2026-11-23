# NAVA CREATIONS — SHIPPING, LOGISTICS & FULFILMENT ARCHITECTURE
**Document ID:** `DOC-G2-PHASE5-SHIPPING`  
**Generated At:** 2026-11-15T09:54:45+05:30  
**Repository:** `D:\NAVA`  
**Branch:** `feature/production-readiness`  
**Role:** Shipping & Fulfilment Integration Engineer & Operations Architect  

---

## 1. STRATEGIC LOGISTICS CONTEXT FOR ARTISANAL JEWELLERY

NAVA CREATIONS ships delicate, high-value bridal bangles, glass accessories, and Kundan artistry across India. This physical reality imposes three non-negotiable operational imperatives:
1. **Zero-Transit-Breakage Packaging:** Bangles (especially handcrafted glass and thread bangles) require rigid internal cushioning, protective bubble lining, and tamper-evident outer packaging.
2. **Exhaustive PIN Code Reach:** Seamless delivery to 26,000+ Indian PIN codes spanning metropolitan hubs (Mumbai, Bengaluru, Delhi) and regional wedding centers (Jaipur, Surat, Varanasi, Coimbatore).
3. **Automated Tracking & Customer Transparency:** Real-time milestone updates via SMS, WhatsApp, and email to eliminate customer anxiety regarding wedding delivery deadlines.

---

## 2. INDIAN COURIER & LOGISTICS AGGREGATOR EVALUATION

| Evaluation Metric | Shiprocket | NimbusPost | Delhivery Direct | India Post Speed Post |
|:---|:---|:---|:---|:---|
| **Courier Network Breadth** | 17+ Couriers (Blue Dart, Delhivery, DTDC, Xpressbees, Shadowfax) | 15+ Couriers (Blue Dart, Delhivery, DTDC, Ekart) | Single Carrier (Delhivery proprietary fleet) | National Government Postal Network |
| **PIN Code Coverage** | 29,000+ PIN codes across India | 29,000+ PIN codes | 18,500+ PIN codes | **100% of Indian PIN codes (Universal)** |
| **Fragile & Jewellery Handling** | Blue Dart Surface / Air Express offers high-security handling | Blue Dart / DTDC specialized surface | Standard parcel handling | Standard parcel handling (No fragile guarantee) |
| **Transit Insurance** | Optional Shiprocket Shield (up to ₹50,000 coverage) | Available via insurer add-on | Available on commercial accounts | Value declared registration |
| **COD Remittance Cycle** | Next-Day Early COD (0.5% fee) or Standard T+3 | Daily early remittance available | Weekly / Bi-weekly | Monthly via postal money order |
| **Shipping Label & AWB API** | High-reliability REST API with PDF label generation | Standard REST API | Robust enterprise REST API | Manual postal counter booking |
| **Webhook Milestones** | Comprehensive webhooks (`pickup`, `in_transit`, `out_for_delivery`, `delivered`, `rto`) | Standard status webhooks | Webhooks & tracking polling | Manual tracking on India Post portal |
| **Suitability for NAVA** | **Recommended Primary Aggregator** | **Strong Secondary Alternative** | Best as direct high-volume carrier | Recommended for remote North-East / rural addresses |

---

## 3. INDIAN PIN CODE & ADDRESS VALIDATION ARCHITECTURE

The checkout and order capture pipelines enforce strict validation for Indian domestic addresses:

### 3.1 Validation Rules
- **Postal Index Number (PIN Code):** Enforced via strict regex: `^[1-9][0-9]{5}$`.
  - Exactly 6 digits.
  - First digit cannot be `0` (Indian postal zones span 1 through 9).
- **Telephone / WhatsApp Contact:** Enforced via `^[6-9]\d{9}$` (10-digit mobile starting with 6, 7, 8, or 9).
- **Mandatory Landmark:** Indian delivery couriers require a recognizable local landmark (e.g. "Near Ganesh Temple", "Opposite City Post Office") to avoid failed first delivery attempts.

### 3.2 Automated City & State Resolution
When scaling, the checkout UI connects to the postal lookup API (`https://api.postalpincode.in/pincode/{PINCODE}`) to auto-populate City and State upon entering the 6th digit of the PIN code, preventing customer typographical errors.

---

## 4. FULFILMENT & REVERSE LOGISTICS (RTO) STATE MACHINE

```
               +-------------------------------------------+
               |        ORDER STATUS: PROCESSING           |
               +-------------------------------------------+
                                     |
                                     v
               +-------------------------------------------+
               |             PACKED & ALLOCATED            |
               | - Workshop packages bangles in rigid box  |
               | - Admin generates Shipping Label & AWB    |
               +-------------------------------------------+
                                     |
                                     v (Courier Scans Package)
               +-------------------------------------------+
               |            STATUS: SHIPPED                |
               | - Tracking URL assigned                   |
               | - Automated Shipping Confirmation sent    |
               +-------------------------------------------+
                                     |
                                     +-----------------------+
                                     |                       |
               (Out for Delivery)    v                       v (Customer Refuses /
               +---------------------------+                    Address Invalid)
               |  OUT_FOR_DELIVERY         |                 +-----------------------+
               +---------------------------+                 |     RTO_INITIATED     |
                             |                               +-----------------------+
                             v (OTP / Signature Confirmed)               |
               +---------------------------+                             v
               |     STATUS: DELIVERED     |                 +-----------------------+
               +---------------------------+                 |    RTO_DELIVERED      |
                                                             | - Package returns     |
                                                             |   to workshop         |
                                                             | - Stock inspected &   |
                                                             |   re-stocked          |
                                                             +-----------------------+
```

### 4.1 Return to Origin (RTO) Defense Protocol
In Indian e-commerce, RTO represents pure financial loss (paying both forward and return freight). NAVA's operational SOP enforces:
1. **Pre-Dispatch Address Scrubbing:** If the customer address lacks a house/flat number or landmark, dispatch is held and customer support calls the customer.
2. **Automated WhatsApp Out-for-Delivery Alert:** The morning the package is out for delivery, an automated alert instructs the customer to keep payment ready (if COD) or ensure someone is home.

---

## 5. PACKAGING SPECIFICATIONS FOR LUXURY BANGLES

To maintain the luxury brand promise and achieve $< 0.1\%$ transit damage:
1. **Primary Layer (Bangle Cushioning):** Bangles are placed over velvet-covered foam mandrels or individually slotted in silk pouches to prevent friction abrasion between Kundan stones.
2. **Secondary Layer (Rigid Keepsake Box):** High-density rigid paperboard box featuring NAVA gold-foil embossing and magnetic closure.
3. **Tertiary Layer (Shock Absorption):** 10mm high-grade double bubble wrap envelope secured with reinforced packing tape.
4. **Outer Layer (Tamper-Evident Security Flyer):** 60-micron biodegradable courier bag featuring tamper-evident void tape and water-resistant thermal shipping label.

---

## 6. CURRENT IMPLEMENTATION & ADMIN WORKFLOW

In `apps/web/app/admin/orders/[id]/page.tsx`, the store manager manages fulfillment with zero manual code deployment:
1. **Fulfillment Action Modal:** Displays current order items, customer delivery address, and contact number.
2. **Carrier Assignment:** Select from active couriers (Blue Dart, Delhivery, DTDC, Xpressbees, India Post).
3. **AWB Assignment:** Entering the Air Waybill number automatically transitions order to `SHIPPED` and triggers customer notification.
4. **RTO Tracking:** If a shipment is returned, entering the RTO AWB records the audit trail and facilitates inventory inspection before re-stocking.
