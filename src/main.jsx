import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './config/i18n'
import App from './App.jsx'
import { ThemeProvider } from '@/theme/ThemeProvider.jsx'
import { AuthProvider } from '@/context/AuthContext.jsx'

createRoot(document.getElementById('root')).render(
	<ThemeProvider>
		<BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
			<AuthProvider>
				<App />
			</AuthProvider>
		</BrowserRouter>
	</ThemeProvider>
)
