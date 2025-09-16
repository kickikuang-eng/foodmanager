// Debug why Apify isn't being used
async function debugApify() {
  console.log('🔧 Debugging Apify Instagram Scraping\n');
  
  const testUrl = 'https://www.instagram.com/p/DHeR4wLyovr/';
  console.log(`Testing Instagram URL: ${testUrl}`);
  
  try {
    // Test the direct extraction endpoint to see what's happening
    const response = await fetch('http://localhost:3004/api/extract-recipe-from-social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        url: testUrl,
        platform: 'instagram'
      })
    });
    
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Success: ${data.success || false}`);
    console.log(`Method: ${data.method || 'unknown'}`);
    console.log(`Confidence: ${data.confidence || 'N/A'}`);
    
    // Check if it's using Apify or falling back
    if (data.method === 'apify') {
      console.log('✅ Apify is being used!');
    } else if (data.method === 'fallback') {
      console.log('⚠️ Using fallback method - Apify failed');
    }
    
    if (data.recipe) {
      console.log(`\n📋 Recipe Details:`);
      console.log(`  Title: ${data.recipe.title || 'N/A'}`);
      console.log(`  Author: ${data.recipe.author || 'N/A'}`);
      console.log(`  Has Caption: ${data.recipe.caption ? '✅ Yes' : '❌ No'}`);
      console.log(`  Has Image: ${data.recipe.image ? '✅ Yes' : '❌ No'}`);
      
      if (data.recipe.caption) {
        console.log(`  Caption: ${data.recipe.caption.substring(0, 200)}...`);
      }
    }
    
    if (data.error) {
      console.log(`❌ Error: ${data.error}`);
    }
    
    if (data.warnings?.length > 0) {
      console.log(`⚠️  Warnings:`);
      data.warnings.forEach(warning => console.log(`    - ${warning}`));
    }
    
    // Full response for debugging
    console.log(`\n📄 Full Response:`);
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.log(`❌ Network Error: ${error.message}`);
  }
}

setTimeout(debugApify, 1000);
