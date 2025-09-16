import { NextResponse } from "next/server";
import { getRunStatus, getDatasetItems, ApifyError } from "@/lib/apify";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    
    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId parameter' }, { status: 400 });
    }

    // Import supabaseAdmin here to avoid circular imports
    const { supabaseAdmin } = await import('@/lib/supabase');

    // Fetch job to get Apify run id
    const { data: job, error: jobErr } = await supabaseAdmin
      .from('scraping_jobs')
      .select('id, result, user_id, url, platform')
      .eq('id', jobId)
      .single();

    if (jobErr || !job) {
      return NextResponse.json({ 
        error: jobErr?.message || 'Job not found' 
      }, { status: 404 });
    }

    const runId = job.result?.apifyRunId;
    if (!runId) {
      return NextResponse.json({ 
        error: 'No Apify run ID found for this job' 
      }, { status: 400 });
    }

    // Get run status from Apify
    const status = await getRunStatus(runId);
    
    let debugData: any = {
      jobId,
      runId,
      status: status.status,
      platform: job.platform,
      url: job.url
    };

    if (status.status === 'SUCCEEDED' && status.defaultDatasetId) {
      try {
        const items = await getDatasetItems(status.defaultDatasetId);
        debugData.datasetId = status.defaultDatasetId;
        debugData.itemCount = items.length;
        debugData.rawData = items;
        
        if (items.length > 0) {
          const firstItem = items[0];
          debugData.analysis = {
            hasTitle: !!(firstItem.title && firstItem.title.trim()),
            hasDescription: !!(firstItem.description && firstItem.description.trim()),
            hasIngredients: !!(firstItem.ingredients && firstItem.ingredients.length > 0),
            hasInstructions: !!(firstItem.instructions && firstItem.instructions.length > 0),
            hasImage: !!(firstItem.image && firstItem.image.trim()),
            titleLength: firstItem.title?.length || 0,
            descriptionLength: firstItem.description?.length || 0,
            ingredientsCount: firstItem.ingredients?.length || 0,
            instructionsCount: firstItem.instructions?.length || 0,
            availableFields: Object.keys(firstItem)
          };
        }
      } catch (error) {
        debugData.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    return NextResponse.json(debugData);

  } catch (error) {
    console.error('Error in debug scrape:', error);
    
    const errorMessage = error instanceof ApifyError 
      ? error.message 
      : 'Internal server error occurred while debugging job';
    
    return NextResponse.json({ 
      error: errorMessage 
    }, { status: 500 });
  }
}
