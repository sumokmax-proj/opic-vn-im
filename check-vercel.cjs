const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleMessages = [];
  const networkRequests = [];
  const networkResponses = [];

  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  page.on('pageerror', err => {
    consoleMessages.push({ type: 'pageerror', text: err.message });
  });

  page.on('request', req => {
    networkRequests.push({ url: req.url(), method: req.method() });
  });

  page.on('response', res => {
    networkResponses.push({ url: res.url(), status: res.status() });
  });

  console.log('=== 페이지 방문 시작 ===');
  let loadStatus = 'unknown';
  try {
    const response = await page.goto('https://opic-vn-im-repo.vercel.app', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    loadStatus = `HTTP ${response.status()} ${response.statusText()}`;
  } catch (e) {
    loadStatus = `ERROR: ${e.message}`;
  }

  console.log(`\n[1] 페이지 로드 상태: ${loadStatus}`);

  await page.waitForTimeout(3000);

  const title = await page.title();
  console.log(`[1] 페이지 타이틀: ${title}`);

  console.log('\n[2] 브라우저 콘솔 메시지:');
  if (consoleMessages.length === 0) {
    console.log('  (없음)');
  } else {
    consoleMessages.forEach(m => {
      console.log(`  [${m.type}] ${m.text}`);
    });
  }

  console.log('\n[3] /api/cards 관련 네트워크 요청:');
  const apiCardsRequests = networkRequests.filter(r => r.url.includes('/api/cards'));
  const apiCardsResponses = networkResponses.filter(r => r.url.includes('/api/cards'));
  
  if (apiCardsRequests.length === 0) {
    console.log('  /api/cards 요청 없음');
  } else {
    apiCardsRequests.forEach(r => {
      console.log(`  요청: [${r.method}] ${r.url}`);
    });
    apiCardsResponses.forEach(r => {
      console.log(`  응답: [${r.status}] ${r.url}`);
    });
  }

  console.log('\n[3-전체] 실패하거나 /api/ 관련 네트워크 응답:');
  const relevantResponses = networkResponses.filter(r => r.status >= 400 || r.url.includes('/api/'));
  if (relevantResponses.length === 0) {
    console.log('  (없음)');
  } else {
    relevantResponses.forEach(r => {
      console.log(`  [${r.status}] ${r.url}`);
    });
  }

  console.log('\n[3-전체API] 모든 API 관련 요청:');
  networkRequests.filter(r => r.url.includes('/api')).forEach(r => {
    console.log(`  요청: [${r.method}] ${r.url}`);
  });

  console.log('\n[4] 페이지 화면 내용:');
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log(bodyText.substring(0, 2000));

  await page.screenshot({ path: '/tmp/vercel-screenshot.png', fullPage: true });
  console.log('\n[스크린샷] /tmp/vercel-screenshot.png 저장됨');

  console.log('\n[4-추가] 에러/로딩 관련 DOM 확인:');
  const errorElements = await page.evaluate(() => {
    const errors = document.querySelectorAll('[class*="error"], [class*="Error"]');
    const results = [];
    errors.forEach(el => results.push({ class: el.className, text: el.innerText.substring(0, 100) }));
    return results;
  });
  if (errorElements.length > 0) {
    errorElements.forEach(e => console.log(`  class="${e.class}": ${e.text}`));
  } else {
    console.log('  에러 관련 DOM 없음');
  }

  // React root 내용 확인
  console.log('\n[4-React] React root innerHTML (처음 500자):');
  const reactRoot = await page.evaluate(() => {
    const root = document.getElementById('root');
    return root ? root.innerHTML.substring(0, 500) : '(root 없음)';
  });
  console.log(reactRoot);

  await browser.close();
})();
