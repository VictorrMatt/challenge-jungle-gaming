import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { router } from '@/app/router'
import { syncSession } from '@/app/session-sync'
import { queryClient } from '@/lib/query/client'
import { RealtimeClient } from '@/lib/realtime/realtime-client'
import { RealtimeContext } from '@/lib/realtime/realtime-context'

syncSession(queryClient, router)

export function App() {
  const [realtime] = useState(() => new RealtimeClient(queryClient))

  useEffect(() => {
    realtime.start()
    return () => realtime.stop()
  }, [realtime])

  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeContext.Provider value={realtime}>
        <RouterProvider router={router} />
      </RealtimeContext.Provider>
    </QueryClientProvider>
  )
}
