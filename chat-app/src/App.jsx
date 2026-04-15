import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Chat from './pages/Chat.jsx';
import { getAccessToken } from './utils/storage.js';

function ProtectedRoute({ children }) {
  return getAccessToken() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <div className="app-root">
      <Routes>
        <Route path="/" element={<Navigate to="/chat" replace />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}
