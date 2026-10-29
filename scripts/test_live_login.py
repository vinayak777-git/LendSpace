import asyncio
from playwright.async_api import async_playwright

async def test_live_login():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        failed_requests = []
        page.on("response", lambda r: failed_requests.append(f"{r.status} {r.url}") if r.status >= 400 else None)

        print("Navigating to / ...")
        await page.goto("https://lendspace-two.vercel.app/", wait_until="networkidle")
        
        # Click Sign in
        await page.locator("a:has-text('Sign in')").first.click()
        await page.wait_for_timeout(1000)
        print("URL after clicking Sign in:", page.url)

        # Fill in email & password
        email_input = page.locator("input[type='email']")
        if await email_input.count() > 0:
            print("Filling login credentials...")
            await email_input.first.fill("test_user@university.edu")
            await page.locator("input[type='password']").first.fill("SomePassword123!")
            
            # Click sign in button
            submit_btn = page.locator("button[type='submit']")
            await submit_btn.first.click()
            await page.wait_for_timeout(3000)

            # Check for error banner on page
            error_banner = page.locator("text='Registration Issue', text='Invalid email', text='Could not sign in', text='failed'")
            banner_count = await error_banner.count()
            print("Error banners found:", banner_count)
            if banner_count > 0:
                print("Banner text:", await error_banner.first.text_content())

            print("\nNetwork requests with status >= 400:")
            for req in failed_requests:
                print("  ", req)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_live_login())

