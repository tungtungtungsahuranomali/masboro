
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  
  await page.goto('http://localhost:19000', { waitUntil: 'networkidle', timeout: 180000 });
  await page.waitForTimeout(3000);
  
  // Verify all
  const body = await page.textContent('body');
  console.log('Mentari:', body.includes('Mentari') ? '❌ FOUND' : '✅ OK');
  console.log('Emoji 📢:', body.includes('\u{1F4E2}') ? '❌ FOUND' : '✅ OK');
  console.log('Emoji 🖼️:', body.includes('\u{1F5BC}') ? '❌ FOUND' : '✅ OK');
  console.log('Emoji 🏷️:', body.includes('\u{1F3F7}') ? '❌ FOUND' : '✅ OK');
  
  // Login
  console.log('\n=== LOGIN ===');
  await page.getByText('Masuk').first().click();
  await page.waitForTimeout(2000);
  
  // Fill inputs
  const inputs = page.locator('input');
  await inputs.nth(0).fill('0812345678');
  await inputs.nth(1).fill('123qwe');
  console.log('Inputs filled');
  
  // Try multiple strategies to click submit
  // Strategy 1: Find by text "Masuk" inside modal
  let clicked = false;
  
  // All elements with text "Masuk"
  const allMasuk = page.getByText('Masuk');
  const count = await allMasuk.count();
  console.log('Total Masuk elements:', count);
  
  // The first one is header button, second one should be the submit
  // Let's click the LAST "Masuk" which should be the modal submit button
  if (count > 1) {
    await allMasuk.nth(count - 1).click();
    clicked = true;
    console.log('Clicked last Masuk element');
  }
  
  if (!clicked) {
    // Try div filter
    await page.locator('div').filter({ hasText: 'Masuk' }).last().click();
    console.log('Clicked last div with Masuk');
  }
  
  await page.waitForTimeout(3000);
  
  const after = await page.textContent('body');
  if (after.includes('mautau') || after.includes('Selamat datang') || after.includes('Keluar')) {
    console.log('\n✅✅✅ LOGIN SUCCESS ✅✅✅');
  } else {
    // Check if modal still open
    if (after.includes('Masuk ke Akun')) {
      console.log('\n⚠️ Modal still open, checking why...');
      // The modal might need scrolling to find the button
      // Try pressing Enter
      console.log('Trying Enter key...');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);
      
      const afterEnter = await page.textContent('body');
      if (afterEnter.includes('mautau') || afterEnter.includes('Selamat datang')) {
        console.log('✅ LOGIN SUCCESS after Enter');
      } else {
        console.log('❌ Still failed. Page:', afterEnter.substring(0, 500));
      }
    }
  }
  
  await page.screenshot({ path: 'test-final.png', fullPage: true });
  console.log('\nDone');
  
  await browser.close();
})();
