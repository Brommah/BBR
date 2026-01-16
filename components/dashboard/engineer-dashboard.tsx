"use client"

import { WeekHourCalendar } from "@/components/engineer-view/week-hour-calendar"

/**
 * Engineer Dashboard - Shows the week hour calendar for time registration
 * 
 * Engineers see their assigned projects and can register hours in a
 * weekly calendar view. The WeekHourCalendar component handles all
 * the data fetching and state management.
 */
export function EngineerDashboard() {
  return <WeekHourCalendar />
}
