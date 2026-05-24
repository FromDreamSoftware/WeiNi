import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';
import ToastContainer from './Toast';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-surface-secondary">
      <TopNav />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
        <Outlet />
      </div>
      <ToastContainer />
    </div>
  );
}
