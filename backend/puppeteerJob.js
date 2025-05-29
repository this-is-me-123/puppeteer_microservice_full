import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();
puppeteer.use(StealthPlugin());

/**
 * Runs a Puppeteer login job for a given folder/session.
 * Captures final URL, cookies, base64 screenshot, and HTML snippet.
 * @param {string} folder - Unique folder name for artifacts.
 * @returns {Promise<object>} - Result payload.
 */
export async function runPuppeteerJob(folder) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();

  try {
    // Navigate to homepage and wait for network idle
    await page.goto("https://onlyfans.com/", { waitUntil: "networkidle2" });

    // Open login modal by clicking the login button
    await page.click('button[aria-label="Log in"]');

    // Wait for the email input to appear
    await page.waitForSelector('input[name="email"]', { timeout: 30000 });

    // Fill credentials
    await page.type('input[name="email"]', process.env.OF_EMAIL, { delay: 50 });
    await page.type('input[name="password"]', process.env.OF_PASSWORD, { delay: 50 });

    // Submit and wait for navigation
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: "networkidle2" })
    ]);

    // Collect artifacts
    const finalUrl = page.url();
    const cookies = await page.cookies();
    const html = await page.content();
    const screenshotBase64 = await page.screenshot({
      encoding: "base64",
      fullPage: true
    });

    // Save artifacts to disk
    const dir = path.join("debug_logs", folder);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "page.html"), html);
    const imgBuffer = Buffer.from(screenshotBase64, "base64");
    fs.writeFileSync(path.join(dir, "login.png"), imgBuffer);

    await browser.close();

    return {
      finalUrl,
      cookies,
      screenshot_base64: screenshotBase64,
      html_snippet: html.slice(0, 1000)
    };
  } catch (err) {
    await browser.close();
    throw err;
  }
}
