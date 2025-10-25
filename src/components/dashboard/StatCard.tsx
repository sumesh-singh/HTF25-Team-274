import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string;
  index: number;
  color: 'blue' | 'green' | 'yellow' | 'red';
}

const colorClasses = {
  blue: 'from-blue-400 to-blue-600',
  green: 'from-green-400 to-green-600',
  yellow: 'from-yellow-400 to-yellow-600',
  red: 'from-red-400 to-red-600',
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: 'easeOut',
    },
  }),
};

const StatCard: React.FC<StatCardProps> = ({ title, value, index, color }) => {
  return (
    <motion.div
      className="relative flex flex-1 flex-col justify-between gap-2 overflow-hidden rounded-xl border border-border-light bg-card-light p-4 shadow-sm transition-transform duration-300 hover:-translate-y-1 dark:border-border-dark dark:bg-card-dark"
      custom={index}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
    >
      <div className={`absolute left-0 top-0 h-1 w-full bg-gradient-to-r ${colorClasses[color]}`}></div>
      <p className="pt-2 text-sm font-medium leading-normal text-text-light-secondary dark:text-text-dark-secondary">{title}</p>
      <p className="text-3xl font-bold leading-tight tracking-tight text-text-light-primary transition-colors duration-300 dark:text-text-dark-primary">{value}</p>
    </motion.div>
  );
};

export default StatCard;
