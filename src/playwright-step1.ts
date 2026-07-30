import { chromium, Page } from 'playwright';

const VAATZ_URL = 'https://www.vaatz.com/';
const CSMS_LIST_URL = 'https://ncsm.hmckmc.co.kr/geshIndex.do?menuId=dss005';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function getTargetWeekend(base = new Date()) {
  const day = base.getDay();
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

export function buildWorkText(items: string[] = []): string {
  const normalized = items.map((x) => x.trim()).filter(Boolean);
  if (normalized.length === 0) return '- 일반';
  if (normalized.length === 1) return normalized[0];
  return normalized.map((x) => x.charAt(0)).join('');
}

async function safeSelectCorporation(page: Page, corporation: string) {
  const select = page.locator('select').first();
  await select.selectOption({ label: corporation }).catch(async () => {
    await select.selectOption({ label: 'KOREA-ENGLISH' }).catch(async () => {
      await select.selectOption({ index: 0 }).catch(() => {});
    });
  });
}

async function loginVaatz(page: Page) {
  const userId = process.env.VAATZ_ID;
  const password = process.env.VAATZ_PASSWORD;
  const corporation = process.env.VAATZ_CORPORATION || 'KOREA - ENGLISH';

  if (!userId || !password) {
    throw new Error('Missing VAATZ_ID or VAATZ_PASSWORD in environment variables.');
  }

  await page.goto(VAATZ_URL, { waitUntil: 'networkidle' });
  await safeSelectCorporation(page, corporation);
  await page.locator('input').nth(0).fill(userId);
  await page.locator('input').nth(1).fill(password);
  await page.getByRole('button', { name: /supplier/i }).click();
  await page.waitForLoadState('networkidle').catch(() => {});
}

async function goToCsmsList(page: Page) {
  await page.goto(CSMS_LIST_URL, { waitUntil: 'networkidle' });
}

async function main() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  const weekend = getTargetWeekend();

  try {
    await loginVaatz(page);
    await goToCsmsList(page);

    console.log(JSON.stringify({
      step: 'STEP1',
      weekend,
      status: 'opened list page',
    }, null, 2));

    console.log(JSON.stringify({
      work: buildWorkText(['화기', '고소', '중량물', '자동화설비', '기타']),
      weekend,
    }, null, 2));
  } finally {
    // Keep the browser open for headed debugging; close manually when done.
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
