import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import Dashboard from './pages/Dashboard';
import MatchDiscovery from './pages/MatchDiscovery';
import Profile from './pages/Profile';
import Sessions from './pages/Sessions';
import MySkills from './pages/MySkills';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Credits from './pages/Credits';
import Chat from './pages/Chat';
import Login from './pages/Login';
import useLenis from './hooks/useLenis';

function App() {
  useLenis();

  return (
    <Routes>
      <Route element={<MainLayout />}>
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
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>
    </Routes>
  );
}

export default App;
