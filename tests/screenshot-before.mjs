import { chromium } from 'playwright'
const DIR = '/tmp/playwright-screenshots'
async function run() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  // Screenshot intro
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: `${DIR}/BEFORE-01-intro.png`, fullPage: true })
  console.log('1. Intro screenshot taken')

  // Click to trigger exit sequence
  await page.click('canvas', { position: { x: 720, y: 400 } })
  await page.waitForTimeout(6000) // Wait for typing + CRT off + transition + town
  await page.screenshot({ path: `${DIR}/BEFORE-02-town.png`, fullPage: true })
  console.log('2. Town screenshot taken')

  // Check for navbar
  const hasNav = await page.evaluate(() => {
    const nav = document.querySelector('nav')
    const header = document.querySelector('header')
    return { nav: !!nav, header: !!header, navText: nav?.textContent, headerText: header?.textContent }
  })
  console.log('3. Nav check:', JSON.stringify(hasNav))

  // Check scroll
  const scrollable = await page.evaluate(() => {
    return { scrollHeight: document.body.scrollHeight, innerHeight: window.innerHeight, scrollY: window.scrollY }
  })
  console.log('4. Scroll check:', JSON.stringify(scrollable))

  // Try scrolling
  await page.mouse.wheel(0, 1000)
  await page.waitForTimeout(300)
  const scrollAfter = await page.evaluate(() => window.scrollY)
  console.log('5. Scroll after wheel:', scrollAfter)
  await page.screenshot({ path: `${DIR}/BEFORE-03-after-scroll.png`, fullPage: true })
  console.log('6. After-scroll screenshot taken')

  await browser.close()
}
run().catch(e => { console.error(e); process.exit(1) })
