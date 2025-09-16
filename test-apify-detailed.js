// Test Apify scraping with detailed logging
async function testApifyDetailed() {
  console.log('🔍 Testing Apify Scraping with Detailed Logging\n');
  
  const testUrls = {
    instagram: 'https://www.instagram.com/p/DHeR4wLyovr/',
    tiktok: 'https://www.tiktok.com/@derekkchen/video/7480603318859861291?q=marry%20me%20chicken&t=1758028177356'
  };

  for (const [platform, url] of Object.entries(testUrls)) {
    console.log(`\n📱 Testing ${platform.toUpperCase()}:`);
    console.log(`URL: ${url}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, platform })
      });
      
      const data = await response.json();
      
      console.log(`Status: ${response.status}`);
      console.log(`Success: ${data.success}`);
      console.log(`Method: ${data.method || 'unknown'}`);
      console.log(`Confidence: ${data.confidence || 'N/A'}`);
      
      if (data.recipe) {
        console.log(`Title: ${data.recipe.title}`);
        console.log(`Author: ${data.recipe.author || 'N/A'}`);
        console.log(`Has Caption: ${data.recipe.caption ? '✅ Yes' : '❌ No'}`);
        console.log(`Has Image: ${data.recipe.image ? '✅ Yes' : '❌ No'}`);
        console.log(`Ingredients: ${data.recipe.ingredients?.length || 0} items`);
        console.log(`Instructions: ${data.recipe.instructions?.length || 0} steps`);
        
        if (data.recipe.caption) {
          console.log(`Caption Preview: ${data.recipe.caption.substring(0, 100)}...`);
        }
      }
      
      if (data.warnings && data.warnings.length > 0) {
        console.log(`Warnings: ${data.warnings.join(', ')}`);
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log('---');
  }
}

setTimeout(testApifyDetailed, 1000);
