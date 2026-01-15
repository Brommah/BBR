/**
 * Project type utility functions
 * 
 * These are client-safe utility functions for determining project characteristics
 * and BRO/Dino Loket integration helpers
 */

// BRO API URLs for client-side use
const BRO_CPT_API = 'https://publiek.broservices.nl/sr/cpt/v1'

/**
 * Check if a project type requires ground investigation data (BRO/Dino Loket)
 */
export function requiresGroundInvestigation(projectType: string): boolean {
  const fundatieTypes = [
    'fundering',
    'fundatie',
    'fundament',
    'funderingsherstel',
    'heipalen',
    'paalfundering',
  ]
  
  return fundatieTypes.some(type => 
    projectType.toLowerCase().includes(type)
  )
}

/**
 * Get CPT visualization/graph URL for displaying sondering results
 */
export function getCPTVisualizationUrl(broId: string): string {
  return `${BRO_CPT_API}/result/${broId}?outputFormat=PNG`
}
