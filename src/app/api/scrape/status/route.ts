import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getRunStatus, getDatasetItems, ApifyError } from '@/lib/apify'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    
    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId parameter' }, { status: 400 })
    }

    // Fetch job to get Apify run id
    const { data: job, error: jobErr } = await supabaseAdmin
      .from('scraping_jobs')
      .select('id, result, user_id, url, platform')
      .eq('id', jobId)
      .single()

    if (jobErr || !job) {
      return NextResponse.json({ 
        error: jobErr?.message || 'Job not found' 
      }, { status: 404 })
    }

    // If job already completed via non-Apify (e.g., YouTube path), return completed
    if (job.result?.recipeId) {
      return NextResponse.json({ 
        status: 'completed',
        recipeId: job.result.recipeId,
        message: 'Job completed'
      })
    }

    const runId = job.result?.apifyRunId
    if (!runId) {
      return NextResponse.json({ 
        error: 'No Apify run ID found for this job' 
      }, { status: 400 })
    }

    // Get run status from Apify
    const status = await getRunStatus(runId)
    
    // Handle successful completion
    if (status.status === 'SUCCEEDED' && status.defaultDatasetId) {
      try {
        const items = await getDatasetItems(status.defaultDatasetId)
        
        if (items.length === 0) {
          // No data returned from scraping
          await supabaseAdmin
            .from('scraping_jobs')
            .update({ 
              status: 'failed',
              error_message: 'No recipe data found in scraped content'
            })
            .eq('id', jobId)
          
          return NextResponse.json({ 
            status: 'failed',
            message: 'No recipe data found in scraped content'
          })
        }

        const rawData = items[0] // Get the first (and should be only) result
        
        // Extract recipe data from various possible fields
        const textContent = rawData.caption || rawData.description || rawData.text || rawData.content || ''
        const hasTextContent = textContent.trim().length > 0
        
        // Extract recipe information from text content
        let extractedIngredients = []
        let extractedInstructions = []
        let extractedTitle = ''
        
        if (hasTextContent) {
          // Extract title (first line or look for recipe keywords)
          const lines = textContent.split('\n').map(line => line.trim()).filter(line => line)
          extractedTitle = lines[0] || `Recipe from ${job.platform}`
          
          // Extract ingredients and instructions from text
          let currentSection = ''
          
          for (const line of lines) {
            const lowerLine = line.toLowerCase()
            
            // Detect ingredients section
            if (lowerLine.includes('ingredients') || lowerLine.includes('ingredient')) {
              currentSection = 'ingredients'
              continue
            }
            
            // Detect instructions section
            if (lowerLine.includes('instructions') || lowerLine.includes('directions') || lowerLine.includes('method') || lowerLine.includes('steps')) {
              currentSection = 'instructions'
              continue
            }
            
            // Add to appropriate section
            if (currentSection === 'ingredients') {
              if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*') || line.match(/^\d+\./)) {
                extractedIngredients.push(line.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '').trim())
              }
            } else if (currentSection === 'instructions') {
              if (line.match(/^\d+\./) || line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
                extractedInstructions.push(line.replace(/^\d+\.\s*/, '').replace(/^[-•*]\s*/, '').trim())
              }
            }
          }
          
          // If no sections found, try to extract from the whole text
          if (extractedIngredients.length === 0 && extractedInstructions.length === 0) {
            // Look for bullet points or numbered lists in the entire text
            for (const line of lines) {
              if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
                extractedIngredients.push(line.replace(/^[-•*]\s*/, '').trim())
              } else if (line.match(/^\d+\./)) {
                extractedInstructions.push(line.replace(/^\d+\.\s*/, '').trim())
              }
            }
          }
        }
        
        // Prepare final recipe data
        const recipeData = {
          title: extractedTitle,
          description: textContent,
          ingredients: extractedIngredients,
          instructions: extractedInstructions,
          url: rawData.url || job.url,
          platform: rawData.platform || job.platform,
          image: rawData.image || rawData.thumbnail || null,
          servings: rawData.servings || null,
          prepTime: rawData.prepTime || null,
          cookTime: rawData.cookTime || null,
          tags: rawData.tags || [job.platform]
        }
        
        // More flexible validation - check for any meaningful content
        const hasTitle = recipeData.title && recipeData.title.trim().length > 0
        const hasIngredients = recipeData.ingredients && recipeData.ingredients.length > 0
        const hasInstructions = recipeData.instructions && recipeData.instructions.length > 0
        const hasDescription = recipeData.description && recipeData.description.trim().length > 0
        
        // Check if we have any meaningful content that could be a recipe
        if (!hasTitle && !hasIngredients && !hasInstructions && !hasDescription) {
          await supabaseAdmin
            .from('scraping_jobs')
            .update({ 
              status: 'failed',
              error_message: 'No recipe data found in scraped content'
            })
            .eq('id', jobId)
          
          return NextResponse.json({ 
            status: 'failed',
            message: 'No recipe data found in scraped content'
          })
        }

        // Prepare recipe data for database insertion with better fallbacks
        const recipeInsert = {
          user_id: job.user_id,
          title: recipeData.title || `Recipe from ${job.platform}`,
          description: recipeData.description || `Recipe scraped from ${job.platform}`,
          source_url: recipeData.url || job.url,
          source_platform: recipeData.platform || job.platform,
          thumbnail_url: recipeData.image || null,
          ingredients: recipeData.ingredients || [],
          instructions: recipeData.instructions || [],
          servings: recipeData.servings || null,
          prep_time: recipeData.prepTime || null,
          cook_time: recipeData.cookTime || null,
          difficulty: 'medium' as const,
          tags: recipeData.tags || [job.platform],
        }

        // Insert recipe into database
        const { data: insertedRecipe, error: recErr } = await supabaseAdmin
          .from('recipes')
          .insert(recipeInsert)
          .select('id')
          .single()

        if (recErr) {
          console.error('Error inserting recipe:', recErr)
          await supabaseAdmin
            .from('scraping_jobs')
            .update({ 
              status: 'failed',
              error_message: `Failed to save recipe: ${recErr.message}`
            })
            .eq('id', jobId)
          
          return NextResponse.json({ 
            status: 'failed',
            message: 'Failed to save recipe to database'
          })
        }

        // Update job status to completed
        await supabaseAdmin
          .from('scraping_jobs')
          .update({ 
            status: 'completed', 
            result: { 
              ...job.result, 
              datasetId: status.defaultDatasetId,
              recipeId: insertedRecipe.id
            }
          })
          .eq('id', jobId)

        return NextResponse.json({ 
          status: 'completed',
          recipeId: insertedRecipe.id,
          message: 'Recipe successfully scraped and saved'
        })

      } catch (error) {
        console.error('Error processing scraped data:', error)
        
        const errorMessage = error instanceof ApifyError 
          ? error.message 
          : 'Failed to process scraped data'
        
        await supabaseAdmin
          .from('scraping_jobs')
          .update({ 
            status: 'failed',
            error_message: errorMessage
          })
          .eq('id', jobId)
        
        return NextResponse.json({ 
          status: 'failed',
          message: errorMessage
        })
      }
    }

    // Handle failed runs
    if (status.status === 'FAILED' || status.status === 'ABORTED' || status.status === 'TIMED-OUT') {
      const errorMessage = `Scraping job ${status.status.toLowerCase()}`
      
      await supabaseAdmin
        .from('scraping_jobs')
        .update({ 
          status: 'failed',
          error_message: errorMessage
        })
        .eq('id', jobId)
      
      return NextResponse.json({ 
        status: 'failed',
        message: errorMessage
      })
    }

    // Job is still processing
    return NextResponse.json({ 
      status: 'processing',
      message: 'Scraping job is still in progress'
    })

  } catch (error) {
    console.error('Error in status check:', error)
    
    const errorMessage = error instanceof ApifyError 
      ? error.message 
      : 'Internal server error occurred while checking job status'
    
    return NextResponse.json({ 
      error: errorMessage 
    }, { status: 500 })
  }
}
