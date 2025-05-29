// backend/puppeteerJob.js
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import dotenv from "dotenv";
import path from "path";

dotenv.config();
puppeteer.use(StealthPlugin());

/**
 * Runs a Puppeteer login/screenshot job.
 * @param {string} folder  A unique folder name (e.g. session id) to group artifacts.
 * @returns {Promise<object>}  Some result object (e.g. screenshot path, cookies, final URL).
 */
export async function runPuppeteerJob(folder) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();

  try {
    // 1. Navigate to login page
    await page.goto("https://onlyfans.com/login", { waitUntil: "domcontentloaded" });

    // 2. Fill in credentials and submit
    await page.type('input[name="email"]', process.env.OF_EMAIL, { delay: 50 });
    await page.type('input[name="password"]', process.env.OF_PASSWORD, { delay: 50 });
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: "networkidle2" })
    ]);

    // 3. Capture final URL & cookies
    const finalUrl = page.url();
    const cookies = await page.cookies();

    // 4. Optionally take a screenshot
    const screenshotPath = path.join("debug_logs", folder, "login.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });

    await browser.close();
    return { finalUrl, cookies, screenshotPath };
  } catch (err) {
    await browser.close();
    throw err;
  }
}
