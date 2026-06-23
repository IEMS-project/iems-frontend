# React + Vite

## GitHub Actions CI/CD

The frontend deploy workflow is `.github/workflows/deploy-frontend.yml`.
It builds and pushes `pthngws/iems-frontend:latest`, then recreates the frontend container on EC2.

Required repository secrets:

```text
DOCKER_USERNAME=pthngws
DOCKER_PASSWORD=<Docker Hub token or password>
EC2_HOST=ec2-32-236-226-233.ap-southeast-2.compute.amazonaws.com
EC2_USER=ec2-user
EC2_SSH_KEY=<private key content>
```

Required repository variables:

```text
VITE_GOOGLE_CLIENT_ID=<Google OAuth client id>
VITE_GITHUB_CLIENT_ID=<GitHub OAuth client id>
VITE_CLOUDINARY_CLOUD_NAME=<Cloudinary cloud name, if used>
```

Production build args are fixed to:

```text
VITE_GATEWAY_URL=/api
VITE_CHATBOT_URL=/api/ai-service
VITE_NOTIFICATION_URL=/api/notification-service
VITE_GOOGLE_REDIRECT_URI=https://iems.io.vn/login
VITE_GITHUB_REDIRECT_URI=https://iems.io.vn/login
```

The workflow writes the EC2 runtime env at `~/iems-frontend/.env` with `HOST_PORT=127.0.0.1:8083`, so Nginx can serve the site through `https://iems.io.vn`.

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

## OAuth config (Google/GitHub)

Create `.env` in `iems-frontend` with:

```
VITE_GATEWAY_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GITHUB_CLIENT_ID=your_github_client_id
VITE_GITHUB_REDIRECT_URI=http://localhost:5173/login
```

`VITE_GITHUB_REDIRECT_URI` must match `github.redirect-uri` in `iam-service` and the callback URL configured in your GitHub OAuth App.
