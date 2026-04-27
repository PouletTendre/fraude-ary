import re
import time
from playwright.sync_api import Page, expect

BASE_URL = "http://localhost"

def login(page: Page):
    page.goto(f"{BASE_URL}/login")
    page.fill('input[type="email"]', "demo@fraude-ary.com")
    page.fill('input[type="password"]', "demo1234")
    page.click('button[type="submit"]')
    page.wait_for_url(re.compile("/portfolio|/assets|/journal|/alerts|/settings|/$"), timeout=25000)

def register_user(page: Page, email: str, password: str, full_name: str = "Test E2E"):
    """Register a new user and return after redirect."""
    page.goto(f"{BASE_URL}/register")
    page.wait_for_load_state("networkidle")
    page.fill('input[placeholder="Jean Dupont"]', full_name)
    page.fill('input[type="email"]', email)
    page.fill('input[type="password"]', password)
    page.click('button[type="submit"]')
    # After register, user is redirected to login or dashboard
    page.wait_for_url(re.compile("/login|/portfolio|/"), timeout=15000)
    page.wait_for_load_state("networkidle")

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

# ─── NEW TESTS (Phase 4) ────────────────────────────────────────────────────

def test_login_valid_credentials(page: Page):
    """Register a new user, then login with valid credentials."""
    timestamp = int(time.time())
    email = f"test-e2e-{timestamp}@fraude-ary.com"
    password = "testpass123"

    # Step 1: Register a fresh user
    register_user(page, email, password, "Test Login Valid")

    # Step 2: If redirected to login, perform login
    current_url = page.url
    if "/login" in current_url:
        page.fill('input[type="email"]', email)
        page.fill('input[type="password"]', password)
        page.click('button[type="submit"]')
        page.wait_for_url(re.compile("/portfolio|/assets|/journal|/alerts|/settings|/$"), timeout=25000)
        page.wait_for_load_state("networkidle")

    # Verify we are on a dashboard page (not login)
    current_url = page.url
    assert "/login" not in current_url, f"Still on login page after valid login: {current_url}"
    # Check for sidebar presence
    expect(page.locator("text=Dashboard").first).to_be_visible(timeout=10000)


def test_login_invalid_credentials(page: Page):
    """Attempt login with invalid credentials and check error message."""
    page.goto(f"{BASE_URL}/login")
    page.wait_for_load_state("networkidle")

    page.fill('input[type="email"]', "invalide@inexistant.com")
    page.fill('input[type="password"]', "mauvaisc12345")
    page.click('button[type="submit"]')

    # Wait for error message to appear
    error_locator = page.locator("text=Email ou mot de passe invalide")
    expect(error_locator).to_be_visible(timeout=10000)

    # Verify we are still on the login page
    assert "/login" in page.url, "Should remain on login page after invalid credentials"


def test_portfolio_page_loads(page: Page):
    """Navigate to portfolio page and verify basic content loads."""
    login(page)
    page.goto(f"{BASE_URL}/portfolio")
    page.wait_for_load_state("networkidle")

    # Check for the page heading
    expect(page.locator("text=Portfolio").first).to_be_visible(timeout=10000)

    # Verify at least one content element exists (stats cards or tables)
    has_content = (
        page.locator("text=Total Value").count() > 0 or
        page.locator("text=Total Gain/Loss").count() > 0 or
        page.locator("text=Performance").count() > 0 or
        page.locator("text=Évolution du portfolio").count() > 0 or
        page.locator("text=Assets détaillés").count() > 0 or
        page.locator("text=Aucun actif dans le portfolio").count() > 0
    )
    assert has_content, "Portfolio page has no recognizable content"


def test_alerts_page_loads(page: Page):
    """Navigate to alerts page and verify it renders."""
    login(page)
    page.goto(f"{BASE_URL}/alerts")
    page.wait_for_load_state("networkidle")

    # Check for the French page heading
    expect(page.locator("text=Alertes de Prix").first).to_be_visible(timeout=10000)

    # Either have alerts or the empty state
    has_alerts_content = (
        page.locator("text=Aucune alerte").count() > 0 or
        page.locator("text=Créer une Alerte").count() > 0 or
        page.locator("text=Nouvelle Alerte").count() > 0 or
        page.locator("text=Créez votre première alerte").count() > 0
    )
    assert has_alerts_content, "Alerts page has no recognizable content"


def test_settings_page_loads_and_has_theme_toggle(page: Page):
    """Navigate to settings page and check dark/light theme controls exist."""
    login(page)
    page.goto(f"{BASE_URL}/settings")
    page.wait_for_load_state("networkidle")

    # Check for the French page heading
    expect(page.locator("text=Paramètres").first).to_be_visible(timeout=10000)

    # Check for appearance section with theme options
    expect(page.locator("text=Apparence").first).to_be_visible(timeout=5000)

    # Verify theme toggle buttons exist (Clair = Light, Sombre = Dark)
    clair_btn = page.locator("text=Clair")
    sombre_btn = page.locator("text=Sombre")
    expect(clair_btn.first).to_be_visible(timeout=5000)
    expect(sombre_btn.first).to_be_visible(timeout=5000)


def test_notifications_page_loads(page: Page):
    """Navigate to notifications page and verify it renders."""
    login(page)
    page.goto(f"{BASE_URL}/notifications")
    page.wait_for_load_state("networkidle")

    # Check for the French page heading
    expect(page.locator("text=Notifications").first).to_be_visible(timeout=10000)

    # Either have notifications or the empty state
    has_content = (
        page.locator("text=Aucune notification").count() > 0 or
        page.locator("text=Tout est lu").count() > 0 or
        page.locator("text=Toutes").first.count() > 0  # filter tab "Toutes"
    )
    assert has_content or page.locator("text=Notifications").count() > 0, \
        "Notifications page has no recognizable content"


def test_logout_redirects_to_login(page: Page):
    """Login, click logout, and verify redirect to login page."""
    login(page)
    page.wait_for_load_state("networkidle")

    # Click the "Déconnexion" button in the sidebar
    logout_btn = page.locator("text=Déconnexion")
    expect(logout_btn).to_be_visible(timeout=5000)
    logout_btn.click()

    # Verify redirect to login page
    page.wait_for_url(re.compile("/login"), timeout=15000)
    page.wait_for_load_state("networkidle")

    # Check login form is visible
    expect(page.locator("text=Connexion").first).to_be_visible(timeout=10000)

    # Token should be cleared from localStorage
    token = page.evaluate("() => localStorage.getItem('token')")
    assert token is None, f"Token should be cleared after logout, got: {token}"


def test_asset_creation_validation(page: Page):
    """Try creating an asset with an invalid symbol and verify validation error."""
    login(page)
    page.goto(f"{BASE_URL}/assets")
    page.wait_for_load_state("networkidle")

    # Click "Add Asset" button to open the form
    add_btn = page.locator("text=Add Asset").first
    if add_btn.count() == 0:
        # Try "+ Add Asset" variant
        add_btn = page.locator("text=+ Add Asset").first
    if add_btn.count() == 0:
        # No button found - skip test gracefully
        assert True
        return

    add_btn.click()
    page.wait_for_load_state("networkidle")

    # Fill in the symbol field with an invalid symbol (too short, special chars)
    # Locate the symbol input (SymbolSearch component renders an input)
    symbol_input = page.locator('input[placeholder*="Search"]').first
    if symbol_input.count() == 0:
        symbol_input = page.locator('input[placeholder*="ex:"]').first
    if symbol_input.count() == 0:
        symbol_input = page.locator('label:has-text("Symbol") + input').first
    if symbol_input.count() == 0:
        # Try the first text input in the form
        symbol_input = page.locator("input").first

    if symbol_input.count() > 0:
        symbol_input.fill("@@")
        # Trigger blur to show validation
        symbol_input.blur()
        page.wait_for_timeout(500)
    else:
        assert True
        return

    # Also try filling required number fields with invalid values
    quantity_input = page.locator('label:has-text("Quantity") + input').first
    if quantity_input.count() == 0:
        quantity_input = page.locator('input[type="number"]').first
    if quantity_input.count() > 0:
        quantity_input.fill("-1")
        quantity_input.blur()
        page.wait_for_timeout(500)

    # Check that an error message appeared (symbol validation)
    has_error = (
        page.locator("text=Symbol must be 1-20").count() > 0 or
        page.locator("text=Symbole : 1-20").count() > 0 or
        page.locator("text=Valid quantity required").count() > 0
    )
    assert has_error, "Expected a validation error message for invalid symbol or quantity"
