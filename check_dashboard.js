import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Navigate to the dashboard
    await page.goto('http://127.0.0.1:8000/employee/dashboard?month=&page=1&year=2026', {
      waitUntil: 'networkidle'
    });
    
    // Wait a moment for the page to fully render
    await page.waitForTimeout(2000);
    
    // Get all inputs with role="combobox"
    const comboboxInputs = await page.locator('input[role="combobox"]').all();
    
    console.log(`Found ${comboboxInputs.length} combobox inputs`);
    
    if (comboboxInputs.length > 1) {
      // Check the second combobox (index 1)
      const secondCombobox = comboboxInputs[1];
      const value = await secondCombobox.getAttribute('value');
      
      console.log(`Second combobox (index 1) value: "${value}"`);
      
      if (value === '2026') {
        console.log('? SUCCESS: The year filter has the correct value "2026"');
      } else {
        console.log(`? FAILED: Expected value "2026", but got "${value}"`);
      }
    } else {
      console.log('? FAILED: Expected at least 2 combobox inputs, but found ' + comboboxInputs.length);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
