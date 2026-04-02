import { createStart } from '@tanstack/react-start'

export const startInstance = createStart(async () => {
  return {
    defaultSsr: true,
  }
})
