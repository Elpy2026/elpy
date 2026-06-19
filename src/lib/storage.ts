import type { HelpRequest } from '../types/request'

const STORAGE_KEY = 'elpy-requests'

export function loadRequests(): HelpRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as HelpRequest[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveRequests(requests: HelpRequest[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
}
