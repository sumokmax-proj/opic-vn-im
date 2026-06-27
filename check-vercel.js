const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleMessages = [];
  const networkRequests = [];
  const networkResponses = [];

  // Console 메시지 수집
  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  // 페이지 에러 수집
  page.on('pageerror', err => {
    consoleMessages.push({ type: 'pageerror', text: err.message });
  });

  // 네트워크 요청 수집
  page.on('request', req => {
    networkRequests.push({ url: req.url(), method: req.method() });
  });

  // 네트워크 응답 수집
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

  // 추가 1초 대기 (비동기 요청 완료)
  await page.waitForTimeout(3000);

  // 페이지 타이틀
  const title = await page.title();
  console.log(`[1] 페이지 타이틀: ${title}`);

  // 콘솔 에러 출력
  console.log('\n[2] 브라우저 콘솔 메시지:');
  if (consoleMessages.length === 0) {
    console.log('  (없음)');
  } else {
    consoleMessages.forEach(m => {
      console.log(`  [${m.type}] ${m.text}`);
    });
  }

  // /api/cards 관련 네트워크 요청
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

  // 모든 네트워크 요청/응답 (실패한 것 포함)
  console.log('\n[3-전체] 주요 네트워크 요청 목록 (실패 포함):');
  networkResponses.forEach(r => {
    if (r.status >= 400 || r.url.includes('/api/')) {
      console.log(`  [${r.status}] ${r.url}`);
    }
  });

  // 페이지 텍스트 내용
  console.log('\n[4] 페이지 화면 내용:');
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log(bodyText.substring(0, 2000));

  // 스크린샷 저장
  await page.screenshot({ path: '/tmp/vercel-screenshot.png', fullPage: true });
  console.log('\n[스크린샷] /tmp/vercel-screenshot.png 저장됨');

  // 에러 관련 DOM 요소 확인
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

  await browser.close();
})();
