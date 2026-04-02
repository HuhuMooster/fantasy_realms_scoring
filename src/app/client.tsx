import { StartClient } from '@tanstack/react-start/client'
import { hydrateRoot } from 'react-dom/client'

import '@/app/tailwind.css'

hydrateRoot(document, <StartClient />)
