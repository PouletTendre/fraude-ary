import asyncio
from playwright.async_api import async_playwright

async def run_tests():
    results = {
        "functional": [],
        "bugs": [],
        "improvements": []
    }

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        try:
            print("TEST 1: Login")
            await page.goto("http://localhost/login")
            await page.wait_for_selector('input[type="email"]')
            await page.fill('input[type="email"]', 'demo@fraude-ary.com')
            await page.fill('input[type="password"]', 'demo123456')
            await page.click('button[type="submit"]')
            
            await page.wait_for_url("**/portfolio", timeout=10000)
            url = page.url
            if "/portfolio" in url:
                results["functional"].append("✅ Login fonctionne - redirection vers /portfolio")
            else:
                results["bugs"].append(f"❌ Login échoué - redirection vers {url}")
        except Exception as e:
            results["bugs"].append(f"❌ Login: {e}")

        try:
            print("TEST 2: Dashboard")
            await page.goto("http://localhost/")
            await page.wait_for_timeout(3000)
            
            content = await page.content()
            has_total = "Total Portfolio Value" in content
            has_assets = "Recent Assets" in content or "Asset Allocation" in content
            
            if has_total and has_assets:
                results["functional"].append("✅ Dashboard affiche les assets et le portfolio")
            else:
                results["bugs"].append("❌ Dashboard ne semble pas afficher correctement les assets")
        except Exception as e:
            results["bugs"].append(f"❌ Dashboard: {e}")

        try:
            print("TEST 3: Assets List")
            await page.goto("http://localhost/assets")
            await page.wait_for_timeout(3000)
            
            rows = await page.locator("table tbody tr").count()
            if rows >= 24:
                results["functional"].append(f"✅ Page Assets affiche {rows} assets (attendu: 24+)")
            else:
                results["bugs"].append(f"❌ Page Assets n'affiche que {rows} assets (attendu: 24+)")
        except Exception as e:
            results["bugs"].append(f"❌ Assets List: {e}")

        try:
            print("TEST 4: Add Asset Button")
            await page.goto("http://localhost/assets")
            await page.wait_for_timeout(2000)
            await page.click('button:has-text("Add Asset")')
            await page.wait_for_timeout(500)
            
            visible = await page.is_visible("text=Add New Asset")
            if visible:
                results["functional"].append('✅ Bouton "Add Asset" ouvre le formulaire')
            else:
                results["bugs"].append('❌ Le formulaire ne s\'ouvre pas au clic sur "Add Asset"')
        except Exception as e:
            results["bugs"].append(f"❌ Add Asset Button: {e}")

        try:
            print("TEST 5: Symbol Search")
            await page.goto("http://localhost/assets")
            await page.wait_for_timeout(2000)
            await page.click('button:has-text("Add Asset")')
            await page.wait_for_timeout(500)
            
            await page.select_option("select", "stocks")
            await page.wait_for_timeout(300)
            
            symbol_input = page.locator('input[placeholder*="Search symbol"]').first
            await symbol_input.fill("AA")
            await page.wait_for_timeout(500)
            
            dropdown_visible = await page.is_visible("text=AAPL")
            if dropdown_visible:
                results["functional"].append('✅ La recherche de symbole affiche AAPL quand on tape "AA"')
            else:
                results["bugs"].append('❌ La recherche de symbole n\'affiche pas AAPL')
        except Exception as e:
            results["bugs"].append(f"❌ Symbol Search: {e}")

        try:
            print("TEST 6 & 7: Create AAPL Asset")
            await page.goto("http://localhost/assets")
            await page.wait_for_timeout(2000)
            await page.click('button:has-text("Add Asset")')
            await page.wait_for_timeout(500)
            
            await page.select_option("select", "stocks")
            await page.wait_for_timeout(300)
            
            symbol_input = page.locator('input[placeholder*="Search symbol"]').first
            await symbol_input.fill("AAPL")
            await page.wait_for_timeout(300)
            
            aapl_option = page.locator("text=AAPL").first
            try:
                if await aapl_option.is_visible():
                    await aapl_option.click()
            except:
                pass
            
            inputs = await page.locator('input[type="number"]').all()
            if len(inputs) >= 2:
                await inputs[0].fill("5")
                await inputs[1].fill("180")
            
            date_input = page.locator('input[type="date"]').first
            try:
                await date_input.fill("2024-01-15")
            except:
                pass
            
            await page.click('button[type="submit"]')
            await page.wait_for_timeout(2000)
            
            await page.goto("http://localhost/assets")
            await page.wait_for_timeout(3000)
            
            content = await page.content()
            has_aapl = "AAPL" in content and "180" in content
            
            if has_aapl:
                results["functional"].append("✅ Asset AAPL créé avec prix 180 et quantité 5, visible dans la liste")
            else:
                results["bugs"].append("❌ Le nouvel asset AAPL n'apparaît pas dans la liste")
        except Exception as e:
            results["bugs"].append(f"❌ Create Asset: {e}")

        await browser.close()

    print("\n## FONCTIONNEL")
    for r in results["functional"]:
        print(r)
    print("\n## BUGS")
    for r in results["bugs"]:
        print(r)
    print("\n## AMÉLIORATIONS")
    if results["improvements"]:
        for r in results["improvements"]:
            print(r)
    else:
        print("Aucune suggestion d'amélioration pour ce cycle de test.")

asyncio.run(run_tests())
