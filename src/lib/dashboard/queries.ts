import { queryOptions } from '@tanstack/react-query'

import { getDashboardData } from '@/app/server/dashboard'

export const dashboardQueryOptions = () =>
  queryOptions({
    queryKey: ['dashboard'],
    queryFn: () => getDashboardData(),
  })
