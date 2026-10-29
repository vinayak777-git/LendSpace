import asyncio
import os
from playwright.async_api import async_playwright

BASE_URL = "https://lendspace-two.vercel.app"

async def test_spa_navigation():
    os.makedirs("test-artifacts/spa", exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()

        console_logs = []
        page.on("console", lambda m: console_logs.append(f"[{m.type}] {m.text}"))

        print("Navigating to root landing page...")
        await page.goto(f"{BASE_URL}/", wait_until="networkidle")
        await page.screenshot(path="test-artifacts/spa/01_home.png")

        # Click "Sign in" link
        signin_link = page.locator("a:has-text('Sign in'), button:has-text('Sign in')")
        if await signin_link.count() > 0:
            print("Clicking 'Sign in' link...")
            await signin_link.first.click()
            await page.wait_for_timeout(2000)
            print("Current URL:", page.url)
            await page.screenshot(path="test-artifacts/spa/02_clicked_signin.png")

        # Now test clicking "Create Account" or "Sign up"
        signup_link = page.locator("a:has-text('Create Account'), a:has-text('Sign up'), a:has-text('Get Started')")
        if await signup_link.count() > 0:
            print("Clicking Signup/Get Started...")
            await signup_link.first.click()
            await page.wait_for_timeout(2000)
            print("Current URL:", page.url)
            await page.screenshot(path="test-artifacts/spa/03_clicked_signup.png")

        # What happens if we reload the page right now while on /signup?
        print("Reloading page while on /signup...")
        reload_resp = await page.reload(wait_until="networkidle")
        print("Reload HTTP status:", reload_resp.status if reload_resp else "None")
        print("Reload Page Title:", await page.title())
        await page.screenshot(path="test-artifacts/spa/04_after_reload.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_spa_navigation())

