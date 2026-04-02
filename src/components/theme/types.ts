export type TTheme =
  | 'dark'
  | 'light'
  | 'synthwave'
  | 'dracula'
  | 'night'
  | 'coffee'
  | 'cupcake'
  | 'nord'
  | 'business'

export interface IThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: TTheme
  storageKey?: string
}

export type TThemeProviderState = {
  theme: TTheme
  setTheme: (theme: TTheme) => void
}
