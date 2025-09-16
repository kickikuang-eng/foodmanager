import { detectPlatform, isValidUrl } from './platform'
import { startApifyActor, getRunStatus, getDatasetItems, ApifyError } from './apify'

/**
 * Utility functions for testing and debugging the scraping functionality
 */

export interface ScrapingTestResult {
  success: boolean
  message: string
  data?: any
  error?: string
}

/**
 * Test if a URL can be processed by the scraping system
 */
export async function testUrlScraping(url: string): Promise<ScrapingTestResult> {
  try {
    // Validate URL format
    if (!isValidUrl(url)) {
      return {
        success: false,
        message: 'Invalid URL format',
        error: 'URL is not valid'
      }
    }

    // Check if platform is supported
    const platform = detectPlatform(url)
    if (!platform) {
      return {
        success: false,
        message: 'Unsupported platform',
        error: 'URL must be from YouTube, Instagram, or TikTok'
      }
    }

    return {
      success: true,
      message: `URL is valid for ${platform} scraping`,
      data: { platform, url }
    }
  } catch (error) {
    return {
      success: false,
      message: 'Error testing URL',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Test the complete scraping flow (without saving to database)
 */
export async function testScrapingFlow(url: string): Promise<ScrapingTestResult> {
  try {
    // First test the URL
    const urlTest = await testUrlScraping(url)
    if (!urlTest.success) {
      return urlTest
    }

    const platform = urlTest.data.platform

    // Start the Apify actor
    const apifyResult = await startApifyActor({ url, platform })
    
    // Wait a bit for the job to start
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Check status
    const status = await getRunStatus(apifyResult.runId)
    
    if (status.status === 'SUCCEEDED' && status.defaultDatasetId) {
      const items = await getDatasetItems(status.defaultDatasetId)
      
      return {
        success: true,
        message: 'Scraping completed successfully',
        data: {
          runId: apifyResult.runId,
          status: status.status,
          items: items,
          itemCount: items.length
        }
      }
    } else if (status.status === 'FAILED' || status.status === 'ABORTED' || status.status === 'TIMED-OUT') {
      return {
        success: false,
        message: `Scraping failed with status: ${status.status}`,
        error: `Job ${status.status.toLowerCase()}`
      }
    } else {
      return {
        success: true,
        message: `Scraping is in progress (${status.status})`,
        data: {
          runId: apifyResult.runId,
          status: status.status
        }
      }
    }
  } catch (error) {
    if (error instanceof ApifyError) {
      return {
        success: false,
        message: 'Apify error occurred',
        error: error.message
      }
    }
    
    return {
      success: false,
      message: 'Unexpected error during scraping test',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get supported platforms
 */
export function getSupportedPlatforms(): string[] {
  return ['youtube', 'instagram', 'tiktok']
}

/**
 * Get example URLs for each platform
 */
export function getExampleUrls(): Record<string, string[]> {
  return {
    youtube: [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ'
    ],
    instagram: [
      'https://www.instagram.com/p/ABC123/',
      'https://instagram.com/reel/XYZ789/'
    ],
    tiktok: [
      'https://www.tiktok.com/@user/video/1234567890',
      'https://vm.tiktok.com/ZM1234567890/'
    ]
  }
}
