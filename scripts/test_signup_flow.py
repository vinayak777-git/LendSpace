import asyncio
from playwright.async_api import async_playwright

async def test_signup_click_flow():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        failed_requests = []
        page.on("response", lambda r: failed_requests.append(f"{r.status} {r.request.method} {r.url}") if r.status >= 400 else None)
        page.on("console", lambda m: print(f"[CONSOLE {m.type}] {m.text}"))

        print("1. Opening root https://lendspace-two.vercel.app/ ...")
        await page.goto("https://lendspace-two.vercel.app/", wait_until="networkidle")

        print("2. Clicking 'Get Started' ...")
        await page.locator("a:has-text('Get Started'), button:has-text('Get Started')").first.click()
        await page.wait_for_timeout(1500)
        print("Current URL:", page.url)

        # On /get-started, choose role
        print("3. On Get Started page: clicking Role Radio Card...")
        role_cards = page.locator("div[role='radio']")
        if await role_cards.count() > 0:
            print(f"Found {await role_cards.count()} role radio cards. Clicking Owner (2nd card)...")
            await role_cards.nth(1).click()
            await page.wait_for_timeout(1000)
        
        # Click Continue
        continue_btn = page.locator("button:has-text('Continue')")
        print("Clicking Continue button...")
        await continue_btn.first.click()
        await page.wait_for_timeout(2000)
        print("URL after Continue:", page.url)

        # Check if we are on /auth/sign-up?role=owner
        await page.screenshot(path="test-artifacts/spa_signup_page.png")
        print("Page title:", await page.title())

        # Fill in owner registration form
        print("4. Filling in Owner Registration Form...")
        name_input = page.locator("input[name='name'], input[placeholder*='Priya Sharma']")
        if await name_input.count() > 0:
            await name_input.first.fill("Dr. Test Owner")
            await page.locator("input[type='email']").first.fill("test_owner_vercel@university.edu")
            await page.locator("input[type='tel'], input[name='phone']").first.fill("+1-555-0199")
            await page.locator("input[type='password']").first.fill("OwnerPassword123!")
            if await page.locator("input[placeholder*='Confirm Password'], input[name='confirmPassword']").count() > 0:
                await page.locator("input[placeholder*='Confirm Password'], input[name='confirmPassword']").first.fill("OwnerPassword123!")

            # Check if there is an institution input
            inst_input = page.locator("input[placeholder*='Stanford University'], input[name='institution']")
            if await inst_input.count() > 0:
                await inst_input.first.fill("University Robotics Center")

            # Check if there are checkboxes like terms
            terms = page.locator("input[type='checkbox']")
            for i in range(await terms.count()):
                try:
                    await terms.nth(i).check()
                except Exception:
                    pass

            # Submit
            print("5. Clicking Submit Registration...")
            submit_btn = page.locator("button[type='submit']")
            await submit_btn.first.click()
            await page.wait_for_timeout(4000)
            await page.screenshot(path="test-artifacts/spa_signup_submitted.png")

            # Look for error banner
            banners = page.locator(".bg-rose-50")
            if await banners.count() > 0:
                print("Observed Error Banner:", await banners.first.inner_text())

        print("\n6. Failed Network Requests (HTTP >= 400):")
        for fr in failed_requests:
            print("  ", fr)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_signup_click_flow())
