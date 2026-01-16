"use server"

/**
 * @fileoverview Analytics Server Actions
 * Fetches data for dashboard visualizations
 */

import prisma from './db'
import { startOfWeek, endOfWeek, subWeeks, format, differenceInDays } from 'date-fns'
import { nl } from 'date-fns/locale'

// ============================================================
// Types
// ============================================================

export interface WeeklyPipelineData {
  week: string
  weekLabel: string
  Nieuw: number
  Calculatie: number
  OfferteVerzonden: number
  Opdracht: number
}

export interface ConversionTimeData {
  period: string
  avgDays: number
  count: number
}

export interface WeeklyRevenueData {
  week: string
  weekLabel: string
  revenue: number
  count: number
}

export interface EmployeeHoursData {
  name: string
  hours: number
  projects: number
  color: string
}

export interface PipelineDistribution {
  Nieuw: number
  Calculatie: number
  OfferteVerzonden: number
  Opdracht: number
}

export interface DashboardAnalytics {
  pipelineData: WeeklyPipelineData[]
  pipelineDistribution: PipelineDistribution
  conversionTime: {
    current: number
    previous: number
    trend: number
    history: ConversionTimeData[]
  }
  revenueData: WeeklyRevenueData[]
  employeeHours: EmployeeHoursData[]
  totals: {
    totalLeads: number
    totalRevenue: number
    totalHours: number
    conversionRate: number
  }
}

// ============================================================
// Analytics Functions
// ============================================================

/**
 * Get weekly pipeline data (leads by status per week)
 */
async function getWeeklyPipelineData(weeks: number = 8): Promise<WeeklyPipelineData[]> {
  const result: WeeklyPipelineData[] = []
  const now = new Date()
  
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
    const weekEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
    
    const leads = await prisma.lead.findMany({
      where: {
        createdAt: {
          gte: weekStart,
          lte: weekEnd,
        },
        deletedAt: null,
      },
      select: {
        status: true,
        projectType: true,
      },
    })
    
    const statusCounts = {
      Nieuw: 0,
      Calculatie: 0,
      OfferteVerzonden: 0,
      Opdracht: 0,
    }
    
    leads.forEach(lead => {
      if (lead.status in statusCounts) {
        statusCounts[lead.status as keyof typeof statusCounts]++
      }
    })
    
    result.push({
      week: format(weekStart, 'yyyy-MM-dd'),
      weekLabel: format(weekStart, 'd MMM', { locale: nl }),
      ...statusCounts,
    })
  }
  
  return result
}

/**
 * Get average conversion time from Nieuw to Opdracht
 */
async function getConversionTimeData(): Promise<{
  current: number
  previous: number
  trend: number
  history: ConversionTimeData[]
}> {
  const now = new Date()
  const fourWeeksAgo = subWeeks(now, 4)
  const eightWeeksAgo = subWeeks(now, 8)
  
  // Get completed leads (Opdracht status) with their creation dates
  const completedLeads = await prisma.lead.findMany({
    where: {
      status: 'Opdracht',
      deletedAt: null,
    },
    select: {
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: 100,
  })
  
  // Calculate average for current period (last 4 weeks)
  const currentPeriodLeads = completedLeads.filter(
    l => l.updatedAt >= fourWeeksAgo
  )
  const currentAvg = currentPeriodLeads.length > 0
    ? currentPeriodLeads.reduce((sum, l) => sum + differenceInDays(l.updatedAt, l.createdAt), 0) / currentPeriodLeads.length
    : 0
  
  // Calculate average for previous period (4-8 weeks ago)
  const previousPeriodLeads = completedLeads.filter(
    l => l.updatedAt >= eightWeeksAgo && l.updatedAt < fourWeeksAgo
  )
  const previousAvg = previousPeriodLeads.length > 0
    ? previousPeriodLeads.reduce((sum, l) => sum + differenceInDays(l.updatedAt, l.createdAt), 0) / previousPeriodLeads.length
    : 0
  
  // Calculate trend (negative is better - faster conversion)
  const trend = previousAvg > 0 ? ((currentAvg - previousAvg) / previousAvg) * 100 : 0
  
  // Build history data (4 weeks)
  const history: ConversionTimeData[] = []
  for (let i = 3; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
    const weekEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
    
    const weekLeads = completedLeads.filter(
      l => l.updatedAt >= weekStart && l.updatedAt <= weekEnd
    )
    
    const avgDays = weekLeads.length > 0
      ? weekLeads.reduce((sum, l) => sum + differenceInDays(l.updatedAt, l.createdAt), 0) / weekLeads.length
      : 0
    
    history.push({
      period: format(weekStart, 'd MMM', { locale: nl }),
      avgDays: Math.round(avgDays * 10) / 10,
      count: weekLeads.length,
    })
  }
  
  return {
    current: Math.round(currentAvg * 10) / 10,
    previous: Math.round(previousAvg * 10) / 10,
    trend: Math.round(trend * 10) / 10,
    history,
  }
}

/**
 * Get weekly revenue data
 */
async function getWeeklyRevenueData(weeks: number = 8): Promise<WeeklyRevenueData[]> {
  const result: WeeklyRevenueData[] = []
  const now = new Date()
  
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
    const weekEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
    
    // Get leads that moved to Opdracht status this week
    const leads = await prisma.lead.findMany({
      where: {
        status: 'Opdracht',
        updatedAt: {
          gte: weekStart,
          lte: weekEnd,
        },
        deletedAt: null,
      },
      select: {
        quoteValue: true,
        value: true,
      },
    })
    
    const revenue = leads.reduce((sum, lead) => sum + (lead.quoteValue || lead.value || 0), 0)
    
    result.push({
      week: format(weekStart, 'yyyy-MM-dd'),
      weekLabel: format(weekStart, 'd MMM', { locale: nl }),
      revenue,
      count: leads.length,
    })
  }
  
  return result
}

/**
 * Get employee hours data for current month
 */
async function getEmployeeHoursData(): Promise<EmployeeHoursData[]> {
  const now = new Date()
  const fourWeeksAgo = subWeeks(now, 4)
  
  // Get time entries for last 4 weeks
  const timeEntries = await prisma.timeEntry.findMany({
    where: {
      date: {
        gte: fourWeeksAgo,
      },
    },
    select: {
      userName: true,
      duration: true,
      leadId: true,
    },
  })
  
  // Group by user
  const userMap = new Map<string, { hours: number; projects: Set<string> }>()
  
  timeEntries.forEach(entry => {
    const existing = userMap.get(entry.userName) || { hours: 0, projects: new Set<string>() }
    existing.hours += entry.duration / 60 // Convert minutes to hours
    if (entry.leadId) {
      existing.projects.add(entry.leadId)
    }
    userMap.set(entry.userName, existing)
  })
  
  // Color palette for employees
  const colors = [
    '#f59e0b', // amber
    '#3b82f6', // blue
    '#10b981', // emerald
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#ef4444', // red
    '#06b6d4', // cyan
    '#84cc16', // lime
  ]
  
  const result: EmployeeHoursData[] = []
  let colorIndex = 0
  
  userMap.forEach((data, name) => {
    result.push({
      name,
      hours: Math.round(data.hours * 10) / 10,
      projects: data.projects.size,
      color: colors[colorIndex % colors.length],
    })
    colorIndex++
  })
  
  // Sort by hours descending
  result.sort((a, b) => b.hours - a.hours)
  
  return result
}

/**
 * Get current pipeline distribution (all active leads by status)
 */
async function getCurrentPipelineDistribution(): Promise<PipelineDistribution> {
  const leads = await prisma.lead.findMany({
    where: { deletedAt: null },
    select: { status: true },
  })
  
  const distribution: PipelineDistribution = {
    Nieuw: 0,
    Calculatie: 0,
    OfferteVerzonden: 0,
    Opdracht: 0,
  }
  
  leads.forEach(lead => {
    if (lead.status in distribution) {
      distribution[lead.status as keyof PipelineDistribution]++
    }
  })
  
  return distribution
}

/**
 * Get all dashboard analytics
 */
export async function getDashboardAnalytics(): Promise<DashboardAnalytics> {
  try {
    const [pipelineData, pipelineDistribution, conversionTime, revenueData, employeeHours] = await Promise.all([
      getWeeklyPipelineData(3).catch(e => { console.error('getWeeklyPipelineData failed:', e); return [] }),
      getCurrentPipelineDistribution().catch(e => { console.error('getCurrentPipelineDistribution failed:', e); return { Nieuw: 0, Calculatie: 0, OfferteVerzonden: 0, Opdracht: 0 } }),
      getConversionTimeData().catch(e => { console.error('getConversionTimeData failed:', e); return { current: 0, previous: 0, trend: 0, history: [] } }),
      getWeeklyRevenueData(3).catch(e => { console.error('getWeeklyRevenueData failed:', e); return [] }),
      getEmployeeHoursData().catch(e => { console.error('getEmployeeHoursData failed:', e); return [] }),
    ])
    
    // Calculate totals
    const totalLeads = await prisma.lead.count({
      where: { deletedAt: null },
    }).catch(e => { console.error('totalLeads count failed:', e); return 0 })
    
    const completedLeads = await prisma.lead.count({
      where: { status: 'Opdracht', deletedAt: null },
    }).catch(e => { console.error('completedLeads count failed:', e); return 0 })
    
    const totalRevenue = revenueData.reduce((sum, w) => sum + w.revenue, 0)
    const totalHours = employeeHours.reduce((sum, e) => sum + e.hours, 0)
    const conversionRate = totalLeads > 0 ? (completedLeads / totalLeads) * 100 : 0
    
    return {
      pipelineData,
      pipelineDistribution,
      conversionTime,
      revenueData,
      employeeHours,
      totals: {
        totalLeads,
        totalRevenue,
        totalHours: Math.round(totalHours),
        conversionRate: Math.round(conversionRate * 10) / 10,
      },
    }
  } catch (error) {
    console.error('getDashboardAnalytics failed overall:', error)
    throw error
  }
}
