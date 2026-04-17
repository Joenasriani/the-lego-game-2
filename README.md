# Lego Build Studio

Client-only Lego build app using a local Vite + React build flow (no runtime Babel/CDN dependencies).

## Scripts

- `npm run dev` - start local development server
- `npm run build` - produce static production bundle in `dist/`
- `npm run preview` - preview the production bundle locally
- `npm run lint` - run ESLint checks
- `npm run test` - run smoke tests headlessly with Vitest

## Data lifecycle

- Build state is saved in `localStorage` under `lego-build`
- App validates saved/imported JSON before hydration
- Import/export is available in the toolbar
- Invalid imports are rejected with visible UI error messages
