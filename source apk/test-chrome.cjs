const { chromium } = require('playwright');

(async () => {
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: [
      '--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu',
      '--disable-extensions', '--disable-background-networking',
      '--disable-sync', '--no-first-run', '--disable-dev-shm-usage',
      '--js-flags=--max-old-space-size=300', '--memory-pressure-off',
    ]
  });
  console.log("Chrome launched (RAM 300MB)");

  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });

  // Track API calls
  let pricesCalls = [];
  let ordersCalls = [];
  await page.route('**/goklin/prices', route => {
    pricesCalls.push(Date.now());
    console.log(`  📡 [/goklin/prices] call #${pricesCalls.length}`);
    route.continue();
  });
  await page.route('**/goklin/orders', route => {
    ordersCalls.push(Date.now());
    console.log(`  📡 [/goklin/orders] call #${ordersCalls.length}`);
    route.continue();
  });

  console.log("=== LOAD PAGE ===");
  await page.goto('http://localhost:19000', { timeout: 120000 });
  await page.waitForTimeout(3000);
  console.log("Page loaded\n");

  // Verify clean
  const body = await page.textContent('body');
  console.log("Mentari:", body.includes('Mentari') ? '❌' : '✅ OK');
  console.log("Emoji:", body.includes('\u{1F4E2}') ? '❌' : '✅ OK');

  // === LOGIN ===
  console.log("\n=== LOGIN ===");
  await page.locator('text=Masuk').nth(0).click();
  await page.waitForTimeout(2000);
  const inputs = page.locator('input');
  await inputs.nth(0).fill('0812345678');
  await inputs.nth(1).fill('123qwe');
  await page.waitForTimeout(500);
  await page.locator('text=Masuk').nth(3).click();
  await page.waitForTimeout(3000);

  const afterLogin = await page.textContent('body');
  if (afterLogin.includes('Keluar')) {
    console.log("✅ Login success\n");
  } else {
    console.log("❌ Login failed\n");
    await browser.close();
    return;
  }

  // Reset counters before Goklin
  pricesCalls = [];
  ordersCalls = [];
  
  // === OPEN GOKLIN ===
  console.log("=== OPEN GOKLIN (first time, no cache) ===");
  
  // Scroll down to find Goklin in quick menu
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(1000);

  const goklinBtn = page.locator('text=Goklin');
  const gCount = await goklinBtn.count();
  console.log(`"Goklin" elements: ${gCount}`);

  if (gCount > 0) {
    await goklinBtn.first().click();
    console.log("Clicked Goklin\n");
  } else {
    console.log("Goklin not found in menu\n");
    await browser.close();
    return;
  }

  // Wait for Goklin page to load
  await page.waitForTimeout(5000);
  
  // Check what loaded
  const goklinBody = await page.textContent('body');
  console.log("=== Goklin page text (first 1000 chars) ===");
  console.log(goklinBody.substring(0, 1000));

  // Summary for first open
  console.log("\n=== FIRST OPEN SUMMARY ===");
  console.log(`  /goklin/prices: ${pricesCalls.length}x`);
  console.log(`  /goklin/orders: ${ordersCalls.length}x`);
  console.log(pricesCalls.length === 1 ? '✅ Prices fetched exactly once' : pricesCalls.length === 0 ? '✅ Prices from cache (no fetch!)' : '⚠️ Prices fetched multiple times');
  console.log(ordersCalls.length === 1 ? '✅ Orders fetched once' : ordersCalls.length === 0 ? '⚠️ Orders not fetched' : '⚠️ Orders multiple fetches');
  
  // Wait to see if polling re-fetches prices
  console.log("\n=== WAITING 35s to check polling does NOT refetch prices ===");
  await page.waitForTimeout(35000);

  console.log(`\n  /goklin/prices: ${pricesCalls.length}x (total)`);
  console.log(`  /goklin/orders: ${ordersCalls.length}x (total)`);
  console.log(pricesCalls.length === 1 ? '✅ Prices still 1x — polling did NOT refetch!' : pricesCalls.length > 1 ? '❌ Prices refetched by polling!' : '✅ Prices from cache only');
  
  // Try navigating back and forth
  console.log("\n=== GO BACK TO HOME & RE-OPEN GOKLIN ===");
  
  // Click back (Ionicons arrow-back or Beranda tab)
  const backBtn = page.locator('[name="arrow-back"], [name="chevron-back"]').first();
  if (await backBtn.isVisible()) {
    await backBtn.click();
    console.log("Clicked back button");
  } else {
    // Try to find a close/back element
    await page.evaluate(() => window.history.back());
    console.log("Navigated back via history");
  }
  await page.waitForTimeout(2000);

  // Go to Goklin again
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(1000);
  const goklinBtn2 = page.locator('text=Goklin');
  if (await goklinBtn2.first().isVisible()) {
    await goklinBtn2.first().click();
    console.log("Re-opened Goklin\n");
  }
  await page.waitForTimeout(5000);

  console.log("=== RE-OPEN SUMMARY ===");
  console.log(`  /goklin/prices total: ${pricesCalls.length}x`);
  console.log(`  /goklin/orders total: ${ordersCalls.length}x`);
  console.log(pricesCalls.length <= 1 ? '✅ Prices still at 1x — cached!' : pricesCalls.length === 2 ? '⚠️ Prices fetched again on re-open' : '❌ Too many price fetches');

  await page.screenshot({ path: 'test-goklin-final.png', fullPage: true });
  console.log("\nScreenshot: test-goklin-final.png");
  
  await browser.close();
  console.log("\nDone");
})();
