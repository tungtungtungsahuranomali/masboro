
const { chromium } = require('playwright');

(async () => {
  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  
  console.log("Edge exists:", require('fs').existsSync(edgePath));
  
  const browser = await chromium.launch({
    executablePath: edgePath,
    headless: true,
    args: [
      '--no-sandbox', '--disable-setuid-sandbox',
      '--disable-gpu', '--disable-extensions',
      '--js-flags=--max-old-space-size=500',
      '--memory-pressure-off',
      '--disable-background-networking',
      '--no-first-run',
      '--disable-sync',
    ]
  });
  
  console.log("Browser launched");
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  
  console.log("Loading page...");
  await page.goto('http://localhost:19000', { timeout: 120000 });
  console.log("Page loaded, waiting for render...");
  await page.waitForTimeout(3000);
  
  const title = await page.title();
  console.log("Title:", title);
  
  const body = await page.textContent('body');
  console.log("Mentari:", body.includes('Mentari') ? '❌' : '✅ OK');
  console.log("Emoji 📢:", body.includes('\u{1F4E2}') ? '❌' : '✅ OK');
  console.log("Emoji 🖼️:", body.includes('\u{1F5BC}') ? '❌' : '✅ OK');
  console.log("Emoji 🏷️:", body.includes('\u{1F3F7}') ? '❌' : '✅ OK');
  
  await page.screenshot({ path: 'test-edge-result.png', fullPage: true });
  console.log("Screenshot saved");
  
  await browser.close();
  console.log("Done");
})();
