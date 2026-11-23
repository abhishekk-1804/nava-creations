import { test, expect } from '@playwright/test';
import path from 'path';

// Load isolated test DB environment safely
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { loadEnvTest, verifyTestDatabaseSafeguards } = require(path.resolve(__dirname, '../../../scripts/test-db-guard'));
verifyTestDatabaseSafeguards();
const env = loadEnvTest();
Object.assign(process.env, env);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { prisma } = require('@nava/db');

test.describe('STAGE 2 — PRE-LAUNCH CERTIFICATION: End-to-End UPI Checkout & Order Confirmation', () => {
  const timestamp = Date.now();
  const customerEmail = `cert.customer.${timestamp}@example.com`;
  const customerPhone = `9845${timestamp.toString().slice(-6)}`;
  const customerPassword = 'SecurePassword123!';
  const customerName = 'Priya Ramanathan';

  test('Full Customer Login, Size 2.4 Bangle Order, UPI UTR Submission, Atomic Stock Decrement & Admin Verification', async ({ page, request }) => {
    // 0. Ensure StoreSettings has dynamic UPI VPA and COD enabled in database
    await prisma.storeSettings.upsert({
      where: { id: 'default' },
      update: {
        upiVpa: 'nava.creations@bharatpe',
        merchantName: 'NAVA Creations Bengaluru Atelier',
        codEnabled: true,
        supportPhone: '+91 72046 28513',
      },
      create: {
        id: 'default',
        upiVpa: 'nava.creations@bharatpe',
        merchantName: 'NAVA Creations Bengaluru Atelier',
        codEnabled: true,
        supportPhone: '+91 72046 28513',
      },
    });

    // Capture initial variant stock for Size 2.4 on Ruby Jadau Bridal Chuda
    const variantBefore = await prisma.productVariant.findFirst({
      where: {
        product: { slug: 'ruby-jadau-bridal-chuda' },
        size: '2.4',
        isActive: true,
      },
      include: { inventoryItem: true, product: true },
    });
    expect(variantBefore).not.toBeNull();
    expect(variantBefore?.inventoryItem).not.toBeNull();
    const initialAvailable = variantBefore?.inventoryItem?.availableQty || 0;
    const initialAllocated = variantBefore?.inventoryItem?.allocatedSoldQty || 0;
    const targetVariantId = variantBefore!.id;
    const targetProductSlug = variantBefore!.product.slug;

    // 1. Customer Authentication via unified UI & Verify /account renders cleanly
    // First register the customer via API or UI
    const regRes = await request.post('http://localhost:3000/api/auth/register', {
      data: {
        email: customerEmail,
        phone: customerPhone,
        password: customerPassword,
        name: customerName,
      },
    });
    expect(regRes.status()).toBe(201);

    // Login via UI (/login)
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="identifier"]', customerEmail);
    await page.fill('input[name="password"]', customerPassword);
    await page.click('button[type="submit"]:has-text("Sign In")');

    // Confirm redirected to /account
    await expect(page).toHaveURL(/\/account$/, { timeout: 10000 });
    await expect(page.locator('h1')).toContainText(customerName);
    await expect(page.locator('text=Saved Addresses')).toBeVisible();
    await expect(page.locator('text=My Orders')).toBeVisible();

    // 2. Navigate to catalogue, select product and Indian size 2.4
    await page.goto(`http://localhost:3000/products/${targetProductSlug}`);
    await expect(page.locator('h1').first()).toBeVisible();

    // Select Size 2.4 button specifically
    const sizeButton = page.locator('button:has-text("2.4")').first();
    await sizeButton.click();

    // Add to cart
    await page.click('button:has-text("Add to Bag")');
    await expect(page.locator('text=Piece added to your shopping bag!')).toBeVisible({ timeout: 10000 });

    // 3. Proceed to /checkout and verify dynamic StoreSettings (UPI VPA & COD)
    await page.goto('http://localhost:3000/checkout');
    await expect(page.locator('h1:has-text("Complete Your Order")')).toBeVisible({ timeout: 10000 });

    // Verify dynamic UPI details from database
    await expect(page.locator('text=UPI ID:').first()).toBeVisible();
    await expect(page.locator('text=nava.creations@bharatpe').first()).toBeVisible();
    await expect(page.locator('text=BharatPe Merchant UPI QR').first()).toBeVisible();

    // Verify UPI method is selected
    const upiRadio = page.locator('input[value="UPI_MERCHANT_QR"]');
    await expect(upiRadio).toBeVisible();
    await expect(upiRadio).toBeChecked();

    // Fill delivery address form
    await page.fill('input[name="name"]', customerName);
    await page.fill('input[name="phone"]', customerPhone);
    await page.fill('input[name="addressLine1"]', '42, Indiranagar 100ft Road, Atelier Lane');
    await page.fill('input[name="city"]', 'Bengaluru');
    await page.selectOption('select[name="stateCode"]', '29');
    await page.fill('input[name="postalCode"]', '560038');

    // 4. Place order and verify generation of Order Number
    await page.click('button:has-text("Confirm & Place Order")');

    // Land on order tracking page
    await expect(page).toHaveURL(/\/orders\/NAV-/, { timeout: 15000 });
    const orderHeading = page.locator('h1:has-text("Order NAV-")');
    await expect(orderHeading).toBeVisible({ timeout: 10000 });
    const orderTitle = await orderHeading.innerText();
    const orderNumber = orderTitle.replace('Order ', '').trim();
    expect(orderNumber).toMatch(/^NAV-/);

    // Submit valid 12-digit UTR reference
    const utrInput = page.locator('input[placeholder*="12 digits"]');
    await expect(utrInput).toBeVisible({ timeout: 10000 });

    const validUtr = `4987${Date.now().toString().slice(-8)}`;
    await utrInput.fill(validUtr);
    await page.click('button:has-text("Submit UTR Reference")');

    // Verify confirmation of UTR submission
    await expect(page.locator('text=UTR Reference Recorded')).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=${validUtr}`)).toBeVisible();

    // Verify Clean Redirection / Display on /checkout/success
    await page.goto(`http://localhost:3000/checkout/success?orderNumber=${orderNumber}`);
    await expect(page.locator('h1:has-text("Order Successfully Placed")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=${orderNumber}`)).toBeVisible();

    // 5. Stock decrement check & Admin Verification:
    // (a) First verify atomic decrement on placement: available_qty is decremented
    const variantPlaced = await prisma.productVariant.findUnique({
      where: { id: targetVariantId },
      include: { inventoryItem: true },
    });
    const placedAvailable = variantPlaced?.inventoryItem?.availableQty || 0;
    expect(placedAvailable).toBe(initialAvailable - 1);

    // (b) Admin authenticates and verifies payment to transition stock from reserved to allocated_sold_qty
    const adminAuthRes = await request.post('http://localhost:3000/api/admin/auth', {
      data: {
        email: 'admin@nava-creations.internal',
        password: 'Admin@Nava2026!',
      },
    });
    expect(adminAuthRes.status()).toBe(200);
    const adminCookie = adminAuthRes.headers()['set-cookie'] || '';

    // Reconcile and verify payment via Admin API
    const verifyRes = await request.post(`http://localhost:3000/api/admin/orders/${orderNumber}/verify-payment`, {
      headers: { Cookie: adminCookie },
      data: {
        verifiedTransactionId: `BANK-LEDGER-CR-${Date.now()}`,
        amountPaise: 399900,
        notes: 'Pre-launch certification bank credit ledger match',
      },
    });
    expect(verifyRes.status()).toBe(200);

    // Confirm allocated_sold_qty is now incremented atomically
    const variantAfter = await prisma.productVariant.findUnique({
      where: { id: targetVariantId },
      include: { inventoryItem: true },
    });
    const finalAvailable = variantAfter?.inventoryItem?.availableQty || 0;
    const finalAllocated = variantAfter?.inventoryItem?.allocatedSoldQty || 0;

    console.log(`Inventory reconciliation: available ${initialAvailable} -> ${finalAvailable}, allocated ${initialAllocated} -> ${finalAllocated}`);
    expect(finalAvailable).toBe(initialAvailable - 1);
    expect(finalAllocated).toBe(initialAllocated + 1);

    // Verify order appears in Customer Account (/account)
    await page.goto('http://localhost:3000/account');
    await expect(page.locator(`text=${orderNumber}`)).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=View Order & Tracking').first()).toBeVisible({ timeout: 10000 });

    // Verify order appears in Admin Orders list (/admin/orders)
    await page.goto('http://localhost:3000/admin/login');
    await page.fill('input[placeholder="admin@nava-creations.internal"]', 'admin@nava-creations.internal');
    await page.fill('input[type="password"]', 'Admin@Nava2026!');
    await page.click('button:has-text("Authenticate Studio Session")');
    await expect(page).toHaveURL(/\/admin$/, { timeout: 10000 });

    await page.goto('http://localhost:3000/admin/orders');
    await expect(page.locator('h1')).toContainText('Orders & Payment Reconciliation');
    await expect(page.locator(`text=${orderNumber}`)).toBeVisible({ timeout: 10000 });
  });
});
