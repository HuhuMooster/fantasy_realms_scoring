// Mobile: exactly the visible screen below the navbar (h-14 = 3.5rem), so a child with
// flex-1 + min-h-0 (e.g. CardPicker `fill`) scrolls on its own instead of the whole page.
// Desktop (lg): a normal page that grows with its content.
export const FULL_HEIGHT_PAGE =
  'p-4 max-w-5xl mx-auto flex flex-col h-[calc(100dvh-3.5rem)] lg:block lg:h-auto'
