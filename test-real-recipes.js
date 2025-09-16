// Test with real recipe URLs
const realRecipeUrls = [
  {
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=CGf6ZgZgHqo', // Example cooking video
    description: 'YouTube Cooking Video'
  },
  {
    platform: 'instagram', 
    url: 'https://www.instagram.com/p/CG0UU3ylwDu/', // The test URL from your instagram-api.ts
    description: 'Instagram Recipe Post'
  }
];

async function testRealRecipes() {
  console.log('🍳 Testing with Real Recipe URLs\n');
  
  for (const test of realRecipeUrls) {
    console.log(`Testing ${test.description}:`);
    console.log(`URL: ${test.url}`);
    console.log(`Platform: ${test.platform}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: test.url, platform: test.platform })
      });
      
      const data = await response.json();
      
      console.log(`Status: ${response.status}`);
      console.log(`Success: ${data.success || false}`);
      console.log(`Method: ${data.method || 'unknown'}`);
      console.log(`Confidence: ${data.confidence || 'N/A'}`);
      
      if (data.recipe) {
        console.log(`\n📋 Recipe Details:`);
        console.log(`  Title: ${data.recipe.title || 'N/A'}`);
        console.log(`  Description: ${data.recipe.description?.substring(0, 100) || 'N/A'}...`);
        console.log(`  Platform: ${data.recipe.platform || 'N/A'}`);
        console.log(`  Author: ${data.recipe.author || 'N/A'}`);
        console.log(`  Image: ${data.recipe.image ? '✅ Available' : '❌ Not available'}`);
        console.log(`  Ingredients: ${data.recipe.ingredients?.length || 0} items`);
        console.log(`  Instructions: ${data.recipe.instructions?.length || 0} steps`);
        
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
      console.log(`❌ Network Error: ${error.message}\n`);
    }
  }
}

// Wait for server and run tests
setTimeout(testRealRecipes, 2000);
