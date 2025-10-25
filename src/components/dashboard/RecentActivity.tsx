import { motion } from 'framer-motion';
import { CheckCircle, CalendarClock, Coins, MessageSquare } from 'lucide-react';

const activities = [
    { icon: CheckCircle, text: "John A. accepted your request", time: "5 min ago", color: "blue", unread: true },
    { icon: CalendarClock, text: "Session with Jane D. starts tomorrow", time: "1 hour ago", color: "purple", unread: true },
    { icon: Coins, text: "You received 10 new credits", time: "1 day ago", color: "green", unread: false },
    { icon: MessageSquare, text: "Maria G. sent you a message", time: "2 days ago", color: "yellow", unread: false },
];

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

const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.1 + 0.8, // Stagger after card animation
        duration: 0.4,
        ease: 'easeOut',
      },
    }),
};

const iconColors = {
    blue: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300',
    purple: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300',
    green: 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-300',
}

const RecentActivity = () => {
  return (
    <motion.div
      className="rounded-xl border border-border-light bg-card-light p-6 shadow-sm dark:border-border-dark dark:bg-card-dark"
      custom={7}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
    >
      <h3 className="mb-4 text-xl font-bold text-text-light-primary dark:text-text-dark-primary">Recent Activity</h3>
      <ul className="flex flex-col gap-1">
        {activities.map((activity, i) => (
          <motion.li
            key={i}
            className={`flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-background-light dark:hover:bg-background-dark ${!activity.unread && 'opacity-70 hover:opacity-100'}`}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={itemVariants}
          >
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${iconColors[activity.color as keyof typeof iconColors]}`}>
              <activity.icon className="h-4 w-4" />
            </div>
            <div className="flex-grow">
              <p className="text-sm text-text-light-primary dark:text-text-dark-primary" dangerouslySetInnerHTML={{ __html: activity.text.replace(/(\w+\s\w\.)/g, '<b>$1</b>') }}></p>
              <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">{activity.time}</p>
            </div>
            {activity.unread && <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary"></div>}
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
};

export default RecentActivity;
