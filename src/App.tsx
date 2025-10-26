import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import Dashboard from "./pages/Dashboard";
import MatchDiscovery from "./pages/MatchDiscovery";
import Profile from "./pages/Profile";
import Sessions from "./pages/Sessions";
import MySkills from "./pages/MySkills";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import Credits from "./pages/Credits";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import useLenis from "./hooks/useLenis";
import { useSocket } from "./hooks/useSocket";
import { useAuthStore } from "./stores/authStore";

function App() {
  useLenis();

  // Initialize socket connection
  useSocket();

  const { isAuthenticated, accessToken, refreshAuth } = useAuthStore();

  // Check for existing auth on app load
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    if (token && refreshToken && !isAuthenticated) {
      // Try to refresh auth if tokens exist but user is not authenticated
      refreshAuth().catch(() => {
        // If refresh fails, clear tokens
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      });
    }
  }, [isAuthenticated, refreshAuth]);

  return (
    <Routes>
      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/discover" element={<MatchDiscovery />} />
        <Route path="/profile/:userId" element={<Profile />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/skills" element={<MySkills />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/credits" element={<Credits />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/chat/:chatId" element={<Chat />} />
      </Route>

      {/* Public routes */}
      <Route
        element={
          <ProtectedRoute requireAuth={false} redirectTo="/">
            <AuthLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/login" element={<Login />} />
      </Route>
    </Routes>
  );
}

export default App;
