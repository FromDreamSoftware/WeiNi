import { Routes, Route, Navigate } from 'react-router-dom';
import AuthGuard from './routes/AuthGuard';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import MoodCheckinPage from './pages/MoodCheckinPage';
import PlaceholderPage from './pages/PlaceholderPage';
import SnackBrowserPage from './pages/SnackBrowserPage';
import ApprovalCenterPage from './pages/ApprovalCenterPage';
import MealOrderPage from './pages/MealOrderPage';
import WorkOrdersPage from './pages/WorkOrdersPage';
import WishlistPage from './pages/WishlistPage';
import PhotoAlbumPage from './pages/PhotoAlbumPage';
import CookingRecordsPage from './pages/CookingRecordsPage';
import NotificationsPage from './pages/NotificationsPage';
import SnackCategoriesPage from './pages/SnackCategoriesPage';
import ProfilePage from './pages/ProfilePage';
import Live2dWidget from './components/Live2dWidget';
import AiChatPanel from './components/AiChatPanel';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
          <Route path="/" element={<HomePage />} />

          {/* Shared */}
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/mood" element={<MoodCheckinPage />} />
          <Route path="/photos" element={<PhotoAlbumPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/cooking" element={<CookingRecordsPage />} />

          {/* Snacks */}
          <Route path="/snacks" element={<SnackBrowserPage />} />

          {/* Meals */}
          <Route path="/meals" element={<MealOrderPage />} />

          {/* Approvals */}
          <Route path="/approvals" element={<ApprovalCenterPage />} />

          {/* Work Orders (submit only) */}
          <Route path="/workorders" element={<WorkOrdersPage />} />

          {/* Boyfriend-only */}
          <Route path="/snack-categories" element={
            <AuthGuard requiredRole="BOYFRIEND"><SnackCategoriesPage /></AuthGuard>
          } />

          {/* Profile */}
          <Route path="/profile" element={<ProfilePage />} />

          {/* Messages */}
          <Route path="/messages" element={
            <PlaceholderPage title="留言板" emoji="💌" description="我们的悄悄话" />
          } />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Live2dWidget />
      <AiChatPanel />
    </>
  );
}
