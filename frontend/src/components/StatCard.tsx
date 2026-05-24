import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  count: number;
  label: string;
  to: string;
  color?: string;
}

export default function StatCard({ icon: Icon, count, label, to, color = 'text-accent' }: StatCardProps) {
  return (
    <Link to={to}>
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="bg-surface rounded-xl shadow-sm p-3 text-center hover:shadow-md transition-shadow"
      >
        <Icon size={18} className={`${color} mx-auto mb-1`} />
        <p className="text-base font-semibold text-text-primary">{count}</p>
        <p className="text-[10px] text-text-muted">{label}</p>
      </motion.div>
    </Link>
  );
}
