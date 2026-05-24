import { motion } from 'framer-motion';

interface Props {
  title: string;
  emoji: string;
  description?: string;
}

export default function PlaceholderPage({ title, emoji, description }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <span className="text-6xl">{emoji}</span>
        <h1 className="text-xl text-text-primary mt-4">{title}</h1>
        {description && (
          <p className="text-text-muted text-sm mt-2">{description}</p>
        )}
        <p className="text-pink-300 text-xs mt-4">即将上线...</p>
      </motion.div>
    </div>
  );
}
