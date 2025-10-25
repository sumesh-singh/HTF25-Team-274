import { motion } from 'framer-motion';

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

const UpcomingSessions = () => {
  return (
    <motion.div
      className="rounded-xl border border-border-light bg-card-light p-6 shadow-sm dark:border-border-dark dark:bg-card-dark"
      custom={6}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
    >
      <h3 className="mb-4 text-xl font-bold text-text-light-primary dark:text-text-dark-primary">Upcoming Sessions</h3>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4 rounded-lg border-l-4 border-primary bg-primary/5 p-4 dark:bg-primary/10">
          <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
            <p className="text-sm font-bold text-primary">OCT</p>
            <p className="text-xl font-black text-primary dark:text-primary-light">25</p>
          </div>
          <div className="flex-grow">
            <p className="font-semibold text-text-light-primary dark:text-text-dark-primary">Intro to Python with Jane D.</p>
            <p className="mb-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">10:00 AM - 11:00 AM</p>
            <button className="flex h-9 w-full cursor-pointer items-center justify-center overflow-hidden rounded-full bg-primary px-3 text-sm font-bold leading-normal tracking-[0.015em] text-white shadow-sm transition-colors hover:bg-primary-light">Join Session</button>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-lg bg-background-light p-4 dark:bg-background-dark">
          <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-border-light dark:bg-border-dark">
            <p className="text-sm font-bold text-text-light-secondary dark:text-text-dark-secondary">OCT</p>
            <p className="text-xl font-black text-text-light-primary dark:text-text-dark-primary">28</p>
          </div>
          <div className="flex-grow">
            <p className="font-semibold text-text-light-primary dark:text-text-dark-primary">Digital Marketing Basics</p>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">2:00 PM - 3:00 PM</p>
          </div>
        </div>
        <div className="py-2 text-center">
          <a className="text-sm font-semibold text-primary hover:underline" href="#">Find more sessions</a>
        </div>
      </div>
    </motion.div>
  );
};

export default UpcomingSessions;
