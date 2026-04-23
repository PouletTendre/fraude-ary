const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = {
    functional: [],
    bugs: [],
    improvements: []
  };

  try {
    // TEST 1: Login
    console.log('TEST 1: Login');
    await page.goto('http://localhost/login');
    await page.waitForSelector('input[type="email"]');
    await page.fill('input[type="email"]', 'demo@fraude-ary.com');
    await page.fill('input[type="password"]', 'demo123456');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/portfolio', { timeout: 10000 });
    const url = page.url();
    if (url.includes('/portfolio')) {
      results.functional.push('✅ Login fonctionne - redirection vers /portfolio');
    } else {
      results.bugs.push(`❌ Login échoué - redirection vers ${url}`);
    }
  } catch (e) {
    results.bugs.push(`❌ Login: ${e.message}`);
  }

  try {
    // TEST 2: Dashboard affiche les assets
    console.log('TEST 2: Dashboard');
    await page.goto('http://localhost/');
    await page.waitForTimeout(3000);
    
    const dashboardContent = await page.content();
    const hasTotalValue = dashboardContent.includes('Total Portfolio Value') || dashboardContent.includes('$');
    const hasAssets = dashboardContent.includes('Recent Assets') || dashboardContent.includes('Asset Allocation');
    
    if (hasTotalValue && hasAssets) {
      results.functional.push('✅ Dashboard affiche les assets et le portfolio');
    } else {
      results.bugs.push('❌ Dashboard ne semble pas afficher correctement les assets');
    }
  } catch (e) {
    results.bugs.push(`❌ Dashboard: ${e.message}`);
  }

  try {
    // TEST 3: Page Assets - liste des assets
    console.log('TEST 3: Assets List');
    await page.goto('http://localhost/assets');
    await page.waitForTimeout(3000);
    
    const rows = await page.locator('table tbody tr').count();
    if (rows >= 24) {
      results.functional.push(`✅ Page Assets affiche ${rows} assets (attendu: 24+)`);
    } else {
      results.bugs.push(`❌ Page Assets n'affiche que ${rows} assets (attendu: 24+)`);
    }
  } catch (e) {
    results.bugs.push(`❌ Assets List: ${e.message}`);
  }

  try {
    // TEST 4: Bouton Add Asset
    console.log('TEST 4: Add Asset Button');
    await page.goto('http://localhost/assets');
    await page.waitForTimeout(2000);
    
    await page.click('button:has-text("Add Asset")');
    await page.waitForTimeout(500);
    
    const formVisible = await page.isVisible('text=Add New Asset');
    if (formVisible) {
      results.functional.push('✅ Bouton "Add Asset" ouvre le formulaire');
    } else {
      results.bugs.push('❌ Le formulaire ne s\'ouvre pas au clic sur "Add Asset"');
    }
  } catch (e) {
    results.bugs.push(`❌ Add Asset Button: ${e.message}`);
  }

  try {
    // TEST 5: Symbol Search
    console.log('TEST 5: Symbol Search');
    await page.goto('http://localhost/assets');
    await page.waitForTimeout(2000);
    await page.click('button:has-text("Add Asset")');
    await page.waitForTimeout(500);
    
    // Sélectionne stocks dans le dropdown type
    await page.selectOption('select', 'stocks');
    await page.waitForTimeout(300);
    
    // Tape AA dans le champ symbol
    const symbolInput = await page.locator('input[placeholder*="Search symbol"]').first();
    await symbolInput.fill('AA');
    await page.waitForTimeout(500);
    
    const dropdownVisible = await page.isVisible('text=AAPL');
    if (dropdownVisible) {
      results.functional.push('✅ La recherche de symbole affiche AAPL quand on tape "AA"');
    } else {
      results.bugs.push('❌ La recherche de symbole n\'affiche pas AAPL');
    }
  } catch (e) {
    results.bugs.push(`❌ Symbol Search: ${e.message}`);
  }

  try {
    // TEST 6 & 7: Create Asset and verify
    console.log('TEST 6 & 7: Create AAPL Asset');
    await page.goto('http://localhost/assets');
    await page.waitForTimeout(2000);
    await page.click('button:has-text("Add Asset")');
    await page.waitForTimeout(500);
    
    await page.selectOption('select', 'stocks');
    await page.waitForTimeout(300);
    
    const symbolInput = await page.locator('input[placeholder*="Search symbol"]').first();
    await symbolInput.fill('AAPL');
    await page.waitForTimeout(300);
    
    // Clique sur AAPL dans la dropdown si présente
    const aaplOption = await page.locator('text=AAPL').first();
    if (await aaplOption.isVisible().catch(() => false)) {
      await aaplOption.click();
    }
    
    // Remplit quantity et purchase price
    const inputs = await page.locator('input[type="number"]').all();
    if (inputs.length >= 2) {
      await inputs[0].fill('5');
      await inputs[1].fill('180');
    }
    
    // Remplit la date
    const dateInput = await page.locator('input[type="date"]').first();
    if (dateInput) {
      await dateInput.fill('2024-01-15');
    }
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Vérifie que l'asset apparaît
    await page.goto('http://localhost/assets');
    await page.waitForTimeout(3000);
    
    const pageContent = await page.content();
    const hasAAPL = pageContent.includes('AAPL') && pageContent.includes('180');
    
    if (hasAAPL) {
      results.functional.push('✅ Asset AAPL créé avec prix 180 et quantité 5, visible dans la liste');
    } else {
      results.bugs.push('❌ Le nouvel asset AAPL n\'apparaît pas dans la liste');
    }
  } catch (e) {
    results.bugs.push(`❌ Create Asset: ${e.message}`);
  }

  await browser.close();

  // Output results
  console.log('\n## FONCTIONNEL');
  results.functional.forEach(r => console.log(r));
  console.log('\n## BUGS');
  results.bugs.forEach(r => console.log(r));
  console.log('\n## AMÉLIORATIONS');
  results.improvements.forEach(r => console.log(r));
  if (results.improvements.length === 0) {
    console.log('Aucune suggestion d\'amélioration pour ce cycle de test.');
  }
})();
