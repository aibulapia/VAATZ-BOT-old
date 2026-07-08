const { chromium } = require('playwright');

(async () => {

    const browser = await chromium.launch({
        channel: 'chrome',      // 설치된 Chrome 사용
        headless: false,        // 화면 표시
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    await page.goto('https://www.vaatz.com');

    console.log("VAATZ 접속 완료");

})();
