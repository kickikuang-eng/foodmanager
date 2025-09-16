// Test script for the unified scraping system
const testUrls = {
  youtube: 'https://www.youtube.com/watch?v=2bhTkHTKF24', // Rick Roll (safe test URL)
  instagram: 'https://www.instagram.com/p/DHeR4wLyovr/', // Specific Instagram URL to test
  tiktok: 'https://www.tiktok.com/@derekkchen/video/7480603318859861291?q=marry%20me%20chicken&t=1758028177356', // Example TikTok URL
};

async function testScraping() {
  console.log('🧪 Testing Unified Scraping System\n');
  
  for (const [platform, url] of Object.entries(testUrls)) {
    console.log(`Testing ${platform.toUpperCase()} URL: ${url}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, platform })
      });
      
      const data = await response.json();
      
      console.log(`Status: ${response.status}`);
      console.log(`Success: ${data.success || false}`);
      console.log(`Method: ${data.method || 'unknown'}`);
      console.log(`Confidence: ${data.confidence || 'N/A'}`);
      
      if (data.recipe) {
        console.log(`Recipe Title: ${data.recipe.title || 'N/A'}`);
        console.log(`Platform: ${data.recipe.platform || 'N/A'}`);
        console.log(`Ingredients Count: ${data.recipe.ingredients?.length || 0}`);
        console.log(`Instructions Count: ${data.recipe.instructions?.length || 0}`);
      }
      
      if (data.error) {
        console.log(`Error: ${data.error}`);
      }
      
      console.log('---\n');
      
    } catch (error) {
      console.log(`❌ Error testing ${platform}: ${error.message}\n`);
    }
  }
}

// Wait a moment for the server to start, then run tests
setTimeout(testScraping, 3000);
