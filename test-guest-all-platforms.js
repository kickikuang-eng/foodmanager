// Test guest mode for all platforms
const testUrls = {
  youtube: 'https://www.youtube.com/watch?v=2bhTkHTKF24',
  instagram: 'https://www.instagram.com/p/DIzXHqGslS4/',
  tiktok: 'https://www.tiktok.com/@derekkchen/video/7480603318859861291?q=marry%20me%20chicken&t=1758028177356'
};

async function testGuestMode() {
  console.log('🧪 Testing Guest Mode for All Platforms\n');
  
  for (const [platform, url] of Object.entries(testUrls)) {
    console.log(`Testing ${platform.toUpperCase()} URL: ${url}`);
    
    try {
      const response = await fetch('http://localhost:3004/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, platform })
      });
      
      const data = await response.json();
      
      console.log(`Status: ${response.status}`);
      console.log(`Success: ${data.success || false}`);
      console.log(`Mode: ${data.mode || 'N/A'}`);
      console.log(`Method: ${data.method || 'unknown'}`);
      console.log(`Confidence: ${data.confidence || 'N/A'}`);
      
      if (data.recipe) {
        console.log(`\n📋 Recipe Details:`);
        console.log(`  Title: ${data.recipe.title || 'N/A'}`);
        console.log(`  Platform: ${data.recipe.platform || 'N/A'}`);
        console.log(`  Author: ${data.recipe.author || 'N/A'}`);
        console.log(`  Image: ${data.recipe.image ? '✅ Available' : '❌ Not available'}`);
        console.log(`  Ingredients: ${data.recipe.ingredients?.length || 0} items`);
        console.log(`  Instructions: ${data.recipe.instructions?.length || 0} steps`);
        
        if (data.recipe.caption) {
          console.log(`  Caption: ${data.recipe.caption.substring(0, 100)}...`);
        }
        
        if (data.recipe.ingredients?.length > 0) {
          console.log(`  Sample Ingredients:`);
          data.recipe.ingredients.slice(0, 3).forEach((ing, i) => {
            console.log(`    ${i+1}. ${ing}`);
          });
        }
        
        if (data.recipe.instructions?.length > 0) {
          console.log(`  Sample Instructions:`);
          data.recipe.instructions.slice(0, 2).forEach((inst, i) => {
            console.log(`    ${i+1}. ${inst}`);
          });
        }
      }
      
      if (data.error) {
        console.log(`❌ Error: ${data.error}`);
      }
      
      if (data.warnings?.length > 0) {
        console.log(`⚠️  Warnings:`);
        data.warnings.forEach(warning => console.log(`    - ${warning}`));
      }
      
      console.log('\n' + '='.repeat(80) + '\n');
      
    } catch (error) {
      console.log(`❌ Error testing ${platform}: ${error.message}\n`);
    }
  }
}

// Also test the direct extraction endpoint
async function testDirectExtraction() {
  console.log('🔧 Testing Direct Extraction API (Guest Mode)\n');
  
  try {
    const response = await fetch('http://localhost:3004/api/extract-recipe-from-social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        url: 'https://www.instagram.com/p/DIzXHqGslS4/',
        platform: 'instagram'
      })
    });
    
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Success: ${data.success || false}`);
    console.log(`Method: ${data.method || 'unknown'}`);
    
    if (data.recipe) {
      console.log(`\n📋 Direct Extraction Recipe:`);
      console.log(`  Title: ${data.recipe.title || 'N/A'}`);
      console.log(`  Author: ${data.recipe.author || 'N/A'}`);
      console.log(`  Ingredients: ${data.recipe.ingredients?.length || 0} items`);
      console.log(`  Instructions: ${data.recipe.instructions?.length || 0} steps`);
    }
    
    if (data.error) {
      console.log(`❌ Error: ${data.error}`);
    }
    
  } catch (error) {
    console.log(`❌ Network Error: ${error.message}`);
  }
}

// Run both tests
setTimeout(async () => {
  await testGuestMode();
  await testDirectExtraction();
}, 2000);
