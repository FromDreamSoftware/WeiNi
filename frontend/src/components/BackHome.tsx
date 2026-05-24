import { Link } from 'react-router-dom';

export default function BackHome() {
  return (
    <Link to="/" className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-pink-400 transition-colors mb-3">
      ← 返回首页
    </Link>
  );
}
