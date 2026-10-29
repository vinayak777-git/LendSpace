import asyncio
from playwright.async_api import async_playwright

async def check_routes():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        routes = [
            "/",
            "/get-started",
            "/auth/sign-in",
            "/auth/sign-up",
            "/owner",
            "/app",
            "/app/discover",
        ]

        print("Checking direct navigation on Vercel deployment:")
        for r in routes:
            url = f"https://lendspace-two.vercel.app{r}"
            resp = await page.goto(url, wait_until="networkidle")
            title = await page.title()
            print(f"{r:20} -> Status {resp.status:3} | Title: {title}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(check_routes())

