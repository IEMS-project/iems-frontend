# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Departments page — list/grid views

The Departments page now supports two viewing modes: grid (card) and list (row). Use the view toggle in the top-right of the "Tổng quan phòng ban" card to switch between them. Both views keep the existing edit/delete actions and navigation to the department detail page.

Manual verification steps:

1. Start the app (`npm run dev`) and open the Departments page.
2. Toggle between grid and list using the two small buttons next to the "Thêm phòng ban" button.
3. Ensure edit/delete still work and the rows/cards navigate to department details when clicked.
