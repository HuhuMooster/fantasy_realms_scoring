export const NAV_ITEMS = [
  { to: '/' as const, label: 'Home', requiresAuth: true },
  { to: '/sessions' as const, label: 'Games', requiresAuth: true },
  { to: '/cards' as const, label: 'Cards', requiresAuth: false },
  { to: '/calculator' as const, label: 'Calculator', requiresAuth: false },
  { to: '/profile' as const, label: 'Profile', requiresAuth: true },
]
