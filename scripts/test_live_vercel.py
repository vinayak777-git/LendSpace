import asyncio
import os
from playwright.async_api import async_playwright

BASE_URL = "https://lendspace-two.vercel.app"

async def test_live():
    os.makedirs("test-artifacts", exist_ok=True)
    results = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()

        console_logs = []
        page_errors = []
        network_failures = []

        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
        page.on("pageerror", lambda err: page_errors.append(str(err)))
        
        def on_response(response):
            if response.status >= 400:
                network_failures.append({
                    "url": response.url,
                    "status": response.status,
                    "status_text": response.status_text,
                })
        page.on("response", on_response)

        # 1. Landing Page (Desktop)
        print("Testing Landing Page Desktop...")
        resp = await page.goto(f"{BASE_URL}/", wait_until="networkidle")
        status = resp.status if resp else "No response"
        title = await page.title()
        print(f"Status: {status}, Title: {title}")
        await page.screenshot(path="test-artifacts/01_landing_desktop.png", full_page=True)

        # Check content
        body_text = await page.inner_text("body")
        print(f"Body length: {len(body_text)}, Preview: {body_text[:200]}")

        # 2. Landing Page (Mobile)
        print("\nTesting Landing Page Mobile...")
        mobile_page = await context.new_page()
        await mobile_page.set_viewport_size({"width": 390, "height": 844})
        await mobile_page.goto(f"{BASE_URL}/", wait_until="networkidle")
        await mobile_page.screenshot(path="test-artifacts/02_landing_mobile.png", full_page=True)
        await mobile_page.close()

        # 3. Test Routes Direct Navigation
        routes_to_test = [
            "/signin",
            "/signup",
            "/discover",
            "/booker/discover",
            "/booker/bookings",
            "/owner/dashboard",
            "/owner/listings",
            "/owner/requests",
            "/owner/calendar",
            "/owner/analytics",
        ]

        print("\nTesting Direct Route Navigation...")
        for r in routes_to_test:
            target_url = f"{BASE_URL}{r}"
            try:
                r_resp = await page.goto(target_url, wait_until="networkidle", timeout=15000)
                r_status = r_resp.status if r_resp else "None"
                r_title = await page.title()
                safe_name = r.strip("/").replace("/", "_")
                await page.screenshot(path=f"test-artifacts/route_{safe_name}.png")
                print(f"Route {r} -> HTTP {r_status} | Title: {r_title}")
            except Exception as e:
                print(f"Route {r} -> FAILED: {e}")

        # 4. Test Registration form on /signup
        print("\nTesting Signup Interaction...")
        await page.goto(f"{BASE_URL}/signup", wait_until="networkidle")
        try:
            # Check if form exists
            name_input = page.locator("input[placeholder*='Priya Sharma'], input[name='name']")
            if await name_input.count() > 0:
                print("Found registration form! Filling inputs...")
                await name_input.first.fill("Test User")
                email_input = page.locator("input[type='email'], input[name='email']")
                await email_input.first.fill("browser_test@university.edu")
                pw_inputs = page.locator("input[type='password']")
                if await pw_inputs.count() >= 1:
                    await pw_inputs.nth(0).fill("SecurePassword123!")
                if await pw_inputs.count() >= 2:
                    await pw_inputs.nth(1).fill("SecurePassword123!")

                submit_btn = page.locator("button[type='submit']")
                if await submit_btn.count() > 0:
                    print("Clicking Submit...")
                    await submit_btn.first.click()
                    await page.wait_for_timeout(3000)
                    await page.screenshot(path="test-artifacts/03_signup_submitted.png")
            else:
                print("Registration input not found on page.")
        except Exception as e:
            print(f"Signup interaction error: {e}")

        await browser.close()

        print("\n" + "=" * 50)
        print("TEST RUN SUMMARY:")
        print(f"Console Logs ({len(console_logs)}):")
        for log in console_logs[:10]:
            print("  ", log)
        print(f"Page Errors ({len(page_errors)}):")
        for err in page_errors:
            print("  ", err)
        print(f"Network Failures >= 400 ({len(network_failures)}):")
        for fail in network_failures:
            print(f"   {fail['status']} {fail['status_text']} - {fail['url']}")
        print("=" * 50)

if __name__ == "__main__":
    asyncio.run(test_live())

