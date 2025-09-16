// src/lib/instagram-apify.ts

export async function scrapeWithApify(url: string): Promise<{ caption?: string; author?: string; thumbnailUrl?: string }> {
  const apiToken = process.env.APIFY_API_TOKEN;
  if (!apiToken) throw new Error("APIFY_API_TOKEN is not set");

  const actorId = process.env.APIFY_ACTOR_ID_INSTAGRAM || "apify~instagram-scraper";
  const payload = {
    postUrls: [url],
    includeComments: true,
    includeLikes: true,
    includeHashtags: true
  } as Record<string, unknown>;

  // Start the actor run
  const actorRunResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!actorRunResponse.ok) {
    const errorText = await actorRunResponse.text();
    throw new Error(`Apify actor start failed: ${actorRunResponse.status} ${errorText}`);
  }

  const runData = await actorRunResponse.json();
  const runId = runData.data.id;

  // Wait for the run to complete (with timeout)
  let attempts = 0;
  const maxAttempts = 30; // 30 seconds timeout

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

    const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
      headers: { "Authorization": `Bearer ${apiToken}` }
    });
    if (!statusResponse.ok) throw new Error(`Failed to check run status: ${statusResponse.status}`);
    const statusData = await statusResponse.json();
    const status = statusData.data.status;
    if (status === "SUCCEEDED") {
      // Get the results
      const resultsResponse = await fetch(`https://api.apify.com/v2/datasets/${statusData.data.defaultDatasetId}/items`, {
        headers: { "Authorization": `Bearer ${apiToken}` }
      });
      if (!resultsResponse.ok) throw new Error(`Failed to get results: ${resultsResponse.status}`);
      const results = await resultsResponse.json();
      if (results && results.length > 0) {
        const result = results[0];
        return {
          caption: result.caption || result.description || null,
          author: result.owner_username || result.owner || result.username || null,
          thumbnailUrl: result.thumbnail || result.cover || null
        };
      }
      return {};
    } else if (status === "FAILED") {
      throw new Error("Apify run failed");
    }
    attempts++;
  }
  throw new Error("Apify run timeout");
}