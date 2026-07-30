const { chromium } = require('playwright');

function pad(n) {
  return String(n).padStart(2, '0');
}

function getTargetWeekend(base = new Date()) {
  const day = base.getDay(); // 0 Sun ... 6 Sat
  const daysUntilSaturday = (6 - day + 7) % 7;
  const saturday = new Date(base);
  saturday.setDate(base.getDate() + daysUntilSaturday);
  saturday.setHours(0, 0, 0, 0);
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);
  return {
    saturday: `${saturday.getFullYear()}/${pad(saturday.getMonth() + 1)}/${pad(saturday.getDate())}`,
    sunday: `${sunday.getFullYear()}/${pad(sunday.getMonth() + 1)}/${pad(sunday.getDate())}`,
  };
}

function buildWorkText(items) {
  if (!items || items.length === 0) return '- 일반';
  if (items.length === 1) return items[0];
  return items.map((x) => x.trim().charAt(0)).join('');
}

async function main() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  const weekend = getTargetWeekend();

  const userId = process.env.VAATZ_ID;
  const password = process.env.VAATZ_PASSWORD;
  const corporation = process.env.VAATZ_CORPORATION || 'KOREA - ENGLISH';

  if (!userId || !password) {
    throw new Error('Missing VAATZ_ID or VAATZ_PASSWORD in environment variables.');
  }

  await page.goto('https://www.vaatz.com/', { waitUntil: 'networkidle' });

  const corpSelect = page.locator('select').first();
  await corpSelect.selectOption({ label: corporation }).catch(async () => {
    await corpSelect.selectOption({ label: 'KOREA-ENGLISH' }).catch(() => {});
  });

  await page.locator('input').nth(0).fill(userId);
  await page.locator('input').nth(1).fill(password);
  await page.getByRole('button', { name: /supplier/i }).click();

  await page.waitForLoadState('networkidle').catch(() => {});

  await page.goto('https://ncsm.hmckmc.co.kr/geshIndex.do?menuId=dss005', { waitUntil: 'networkidle' });

  console.log(JSON.stringify({
    step: 'STEP1',
    weekend,
    status: 'opened list page',
  }, null, 2));

  const demo = {
    work: buildWorkText(['화기', '고소', '중량물', '자동화설비', '기타']),
    weekend,
  };
  console.log(JSON.stringify(demo, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
