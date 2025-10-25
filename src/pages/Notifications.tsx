import React from 'react';
import { Settings, Search, CheckCircle, Users, CalendarClock } from 'lucide-react';

const notifications = [
    { icon: Users, title: "New potential skill match", description: "David is looking for Python help. You might be a great fit!", time: "2 hours ago", unread: true, color: "primary" },
    { icon: CheckCircle, title: "Session Request Accepted", description: "Alice has accepted your session request for 'Intro to Figma'.", time: "5 days ago", unread: false, color: "gray" },
    { icon: CalendarClock, title: "Session Reminder", description: "Your 'Advanced UI Design' session with Clara is starting in 15 minutes.", time: "3 days ago", unread: true, color: "primary" },
];

const NotificationItem = ({ notification }: { notification: typeof notifications[0] }) => (
    <div className={`flex items-start gap-4 p-4 rounded-lg ${notification.unread ? 'bg-primary/10 dark:bg-primary/20 border-l-4 border-primary' : 'hover:bg-gray-100 dark:hover:bg-card-dark/50'}`}>
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${notification.unread ? 'bg-primary/20 text-primary' : 'bg-gray-200 text-gray-600 dark:bg-border-dark dark:text-text-dark-secondary'}`}>
            <notification.icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
            <p className="text-sm font-semibold text-text-light-primary dark:text-white">{notification.title}</p>
            <p className="text-sm text-text-light-secondary dark:text-gray-300">{notification.description}</p>
            <p className="mt-1 text-xs text-text-light-secondary dark:text-gray-400">{notification.time}</p>
        </div>
    </div>
);

const Notifications = () => {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex min-w-72 flex-col gap-1">
                    <h1 className="text-3xl font-black leading-tight tracking-[-0.033em] text-text-light-primary dark:text-white">Notifications</h1>
                    <p className="text-base font-normal leading-normal text-text-light-secondary dark:text-gray-400">Manage your notifications and preferences.</p>
                </div>
                <button className="flex h-10 items-center justify-center gap-2 rounded-lg bg-gray-200 px-4 text-sm font-bold leading-normal text-text-light-primary hover:bg-gray-300 dark:bg-border-dark dark:text-white dark:hover:bg-slate-700">
                    <Settings className="h-4 w-4" />
                    <span>Notification Settings</span>
                </button>
            </div>
            <div className="flex flex-col gap-2">
                {notifications.map((n, i) => <NotificationItem key={i} notification={n} />)}
            </div>
        </div>
    );
};

export default Notifications;
