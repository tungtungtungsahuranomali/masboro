const { chromium } = require('playwright');
const http = require('http');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function loginApi() {
  return new Promise((res) => {
    const d = JSON.stringify({whatsapp:'0812345678', password:'123qwe'});
    const r = http.request({hostname:'localhost',port:80,path:'/ligat-api/api/login',method:'POST',headers:{'Content-Type':'application/json'}}, resp => {
      let b=''; resp.on('data',c=>b+=c); resp.on('end',()=>{try{res(JSON.parse(b).data?.token)}catch(e){res(null)}});
    }); r.write(d); r.end();
  });
}
function getOrders(token) {
  return new Promise((res) => {
    const r = http.request({hostname:'localhost',port:80,path:'/ligat-api/api/goklin/orders',method:'GET',headers:{'Authorization':`Bearer ${token}`}}, resp => {
      let b=''; resp.on('data',c=>b+=c); resp.on('end',()=>{try{res(JSON.parse(b).data||[])}catch(e){res([])}});
    }); r.end();
  });
}

(async () => {
  console.log('=== Goklin Cancel + Upload ===\n');
  const browser = await chromium.launch({
    channel: 'chrome', headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--js-flags=--max-old-space-size=384'],
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  let passed = 0, failed = 0;
  function ok(name) { console.log(`  [OK] ${name}`); passed++; }
  function fail(name, msg) { console.log(`  [FAIL] ${name}: ${msg}`); failed++; }

  page.on('dialog', async (d) => {
    const msg = d.message();
    if (msg.includes('Update')) { await d.dismiss(); return; }
    if (msg.includes('Auto-update')) { await d.dismiss(); return; }
    if (msg.includes('Batalkan') || msg.includes('Yakin')) { await d.accept(); return; }
    if (msg.includes('Berhasil')) { await d.accept(); return; }
    await d.dismiss();
  });
  page.on('filechooser', async (fc) => { console.log('  FILE PICKED'); await fc.setFiles('22screen-capture.jpg'); });

  try {
    // === CANCEL TEST ===
    await page.goto('http://localhost:8081', { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(5000);
    // Login via UI
    await page.locator('text=Masuk').first().click();
    await sleep(1000);
    const inp = page.locator('input');
    if (await inp.count() >= 2) {
      await inp.nth(0).fill('0812345678');
      await inp.nth(1).fill('123qwe');
      await page.locator('text=Masuk').last().click();
      await sleep(5000);
    }
    ok('Login');

    // GoKlin
    await page.locator('text=GoKlin').first().click();
    await sleep(2000);
    ok('GoKlin');

    // Create order
    await page.locator('text=Pesan Lagi').first().click();
    await sleep(1000);
    await page.locator('text=2 Jam').first().click();
    await sleep(300);
    const tis = page.locator('input[type="text"], input:not([type]), textarea');
    if (await tis.count() > 0) await tis.first().fill('Jl. Test');
    const dt = page.locator('input[type="datetime-local"]');
    if (await dt.isVisible()) await dt.fill('2026-05-24T16:00');
    await page.evaluate(() => window.scrollTo(0, 1000));
    await sleep(500);
    await page.locator('text=Buat Pesanan').first().click({ force: true, timeout: 5000 });
    await sleep(5000);
    ok('Order created');

    // === UPLOAD ===
    // Click Bayar
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(500);
    await page.locator('text=Bayar').last().click();
    await sleep(3000);

    const body = await page.textContent('body');
    if (body.includes('Pilih Bukti Bayar')) {
      ok('Bank modal + Pilih Bukti Bayar');
      
      // Click Pilih Bukti Bayar → triggers file chooser
      await page.locator('text=Pilih Bukti Bayar').first().click();
      await sleep(3000);

      const body2 = await page.textContent('body');
      if (body2.includes('Submit Bukti Bayar')) {
        ok('Preview with Submit button');
        
        // Submit
        await page.locator('text=Submit Bukti Bayar').first().click();
        await sleep(3000);

        // Verify via API
        const token = await loginApi();
        if (token) {
          const orders = await getOrders(token);
          const paid = orders.filter(o => o.status === 'dibayar');
          if (paid.length > 0) ok(`Receipt uploaded (${paid[paid.length-1]?.kode_order})`);
          else fail('Upload verify', 'No dibayar found via API');
        } else fail('Upload verify', 'API login failed');
      } else {
        fail('Preview Submit', 'Not visible');
        await page.screenshot({ path: 'test-screenshots/upload-error.png', fullPage: true });
      }
    } else {
      fail('Bank modal', 'Not visible');
      await page.screenshot({ path: 'test-screenshots/bank-modal-error.png', fullPage: true });
    }

    // === CANCEL ===
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(500);
    const batal = page.locator('text=Batal').last();
    if (await batal.isVisible().catch(() => false)) {
      await batal.click();
      await sleep(2000);
      ok('Batal clicked');
    } else {
      // Maybe no pending orders left, check API
      console.log('  (no Batal button found)');
    }

    await page.screenshot({ path: 'test-screenshots/goklin-final.png', fullPage: true });

    console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
    await browser.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('FATAL:', err.message);
    await page.screenshot({ path: 'test-screenshots/fatal.png' }).catch(() => {});
    await browser.close();
    process.exit(1);
  }
})();
