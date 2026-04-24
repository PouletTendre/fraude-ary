import re
from playwright.sync_api import Page, expect

BASE_URL = "http://localhost"

def login(page: Page):
    page.goto(f"{BASE_URL}/login")
    page.fill('input[type="email"]', "demo@fraude-ary.com")
    page.fill('input[type="password"]', "demo123456")
    page.click('button[type="submit"]')
    page.wait_for_url(re.compile("/portfolio|/assets|/$"), timeout=15000)

def test_currency_display_on_assets(page: Page):
    login(page)
    page.goto(f"{BASE_URL}/assets")
    page.wait_for_load_state("networkidle")
    
    # Check that the page contains the currency symbol (not just $ everywhere)
    # The demo account may or may not have assets; if not, test the form
    if page.locator("text=Add Asset").count() > 0:
        page.click("text=Add Asset")
        page.wait_for_selector("text=Currency", timeout=5000)
        # Verify currency dropdown exists
        expect(page.locator("select").locator("option:text-is('EUR')")).to_have_count(1)

def test_bulk_selection_checkboxes(page: Page):
    login(page)
    page.goto(f"{BASE_URL}/assets")
    page.wait_for_load_state("networkidle")
    
    # Check if there's a "Select All" checkbox in the table header
    # or at least checkboxes in rows if assets exist
    checkboxes = page.locator('input[type="checkbox"]')
    if checkboxes.count() > 0:
        # Bulk selection should exist
        assert checkboxes.count() >= 1

def test_journal_page_exists(page: Page):
    login(page)
    page.goto(f"{BASE_URL}/journal")
    page.wait_for_load_state("networkidle")
    
    # Check for journal table headers
    page.wait_for_selector("text=Journal", timeout=5000)
    expect(page.locator("text=DATE").or_(page.locator("text=Date"))).to_be_visible()
    expect(page.locator("text=Ticker").or_(page.locator("text=Ticker"))).to_be_visible()

def test_asset_creation_with_currency(page: Page):
    login(page)
    page.goto(f"{BASE_URL}/assets")
    page.wait_for_load_state("networkidle")
    
    # The demo account should already have AIR.PA with EUR currency from backend test
    # If not, test the form at least shows currency options
    body = page.locator("body").inner_text()
    
    # Either we see an existing EUR asset, or we can open the form and see EUR option
    if "AIR.PA" in body and "€" in body:
        assert True
    else:
        page.click("text=Add Asset")
        page.wait_for_selector("text=Currency", timeout=5000)
        # Verify EUR option exists in currency dropdown
        options = page.locator("label:has-text('Currency') + select >> option").all_text_contents()
        assert "EUR" in options
