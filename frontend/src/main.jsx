import React from 'react'
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import App from './App.jsx'
import './index.css'

// Mount the React app into the <div id="root"> in index.html.
// Provider order matters — each wrapper only has access to the ones outside it:
//
//  StrictMode      — highlights potential problems in development (double-invokes
//                    effects and renders to surface side-effect bugs); no-op in production
//  ErrorBoundary   — catches unhandled render errors and shows a fallback UI
//                    instead of a blank screen
//  BrowserRouter   — enables client-side routing via the History API (clean URLs,
//                    no hash fragments); must wrap everything that uses <Route> or hooks
//                    like useNavigate / useLocation
//  AuthProvider    — exposes auth state (token, user, login, logout) to the entire tree
//                    via useAuth(); placed inside BrowserRouter so it can call useNavigate
//  App             — root component that owns routing, global state, and page layout
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
