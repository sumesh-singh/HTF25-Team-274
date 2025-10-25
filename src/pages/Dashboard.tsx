import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import UpcomingSessions from '@/components/dashboard/UpcomingSessions';
import RecentActivity from '@/components/dashboard/RecentActivity';
import TopMatches from '@/components/dashboard/TopMatches';

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

const Dashboard: React.FC = () => {
  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-8">
        <div className="flex flex-col gap-6">
          <motion.div
            className="rounded-xl border border-border-light bg-card-light p-6 shadow-sm dark:border-border-dark dark:bg-card-dark"
            custom={0}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-3xl font-bold leading-tight tracking-tight text-text-light-primary dark:text-text-dark-primary">Good morning, Alex!</p>
                <p className="text-base text-text-light-secondary dark:text-text-dark-secondary">Here's your dashboard overview for today.</p>
              </div>
              <button className="flex h-10 min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full bg-primary px-5 pl-4 text-sm font-semibold leading-normal tracking-wide text-white shadow-sm transition-colors hover:bg-primary-light dark:hover:bg-primary-light">
                <span className="truncate">Complete Your Profile</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <div className="flex justify-between gap-6">
                <p className="text-sm font-medium leading-normal text-text-light-primary dark:text-text-dark-primary">Profile Completeness</p>
                <p className="text-sm font-bold leading-normal text-text-light-primary dark:text-text-dark-primary">75%</p>
              </div>
              <div className="relative h-2.5 w-full overflow-hidden rounded-full border border-border-light bg-background-light dark:border-border-dark dark:bg-background-dark">
                <div className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-primary-light to-primary transition-all duration-500" style={{ width: '75%' }}></div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Credit Balance" value="120" index={1} color="blue" />
            <StatCard title="Total Sessions" value="15" index={2} color="green" />
            <StatCard title="Average Rating" value="4.8" index={3} color="yellow" />
            <StatCard title="Active Requests" value="3" index={4} color="red" />
          </div>

          <motion.div
            className="rounded-xl border border-border-light bg-card-light p-6 shadow-sm dark:border-border-dark dark:bg-card-dark"
            custom={5}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <h3 className="mb-4 text-xl font-bold text-text-light-primary dark:text-text-dark-primary">Top Match Suggestions</h3>
            <TopMatches />
          </motion.div>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-4">
        <div className="flex flex-col gap-6">
          <UpcomingSessions />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
