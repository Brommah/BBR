"use server"

/**
 * Server Actions Layer
 * Re-exports all database operations for use in client components
 * All functions are validated and return consistent result types
 */

export {
  getLeads,
  getLead,
  createLead,
  updateLeadStatus,
  updateLeadAssignee,
  updateLeadSpecs,
  submitQuoteForApproval,
  approveQuote,
  rejectQuote,
  addNote,
  getNotes,
  getActivities,
  getCostRates,
  createCostRate,
  updateCostRate,
  deleteCostRate
} from './db-actions'
