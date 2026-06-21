import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { acceptHelpRequest, fetchAllRequests } from '../lib/requests'
import type { HelpRequest } from '../types/request'

interface RequestsContextValue {
  requests: HelpRequest[]
  openCount: number
  acceptedCount: number
  refreshRequests: () => Promise<void>
  acceptRequest: (id: string) => Promise<{ error: string | null }>
}

const RequestsContext = createContext<RequestsContextValue | null>(null)

export function RequestsProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<HelpRequest[]>([])

  const refreshRequests = useCallback(async () => {
    const { data, error } = await fetchAllRequests()
    if (!error) {
      setRequests(data)
    }
  }, [])

  useEffect(() => {
    void refreshRequests()
  }, [refreshRequests])

  const acceptRequest = useCallback(
    async (id: string): Promise<{ error: string | null }> => {
      const result = await acceptHelpRequest(id)

      if (!result.error) {
        await refreshRequests()
      }

      return result
    },
    [refreshRequests],
  )

  const openCount = useMemo(
    () => requests.filter((request) => request.stato === 'aperta').length,
    [requests],
  )

  const acceptedCount = useMemo(
    () => requests.filter((request) => request.stato === 'accettata').length,
    [requests],
  )

  const value = useMemo(
    () => ({ requests, openCount, acceptedCount, refreshRequests, acceptRequest }),
    [requests, openCount, acceptedCount, refreshRequests, acceptRequest],
  )

  return (
    <RequestsContext.Provider value={value}>{children}</RequestsContext.Provider>
  )
}

export function useRequests() {
  const context = useContext(RequestsContext)
  if (!context) {
    throw new Error('useRequests must be used within RequestsProvider')
  }
  return context
}