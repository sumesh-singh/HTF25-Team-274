import { Search, MoreVertical } from 'lucide-react';

interface ChatHeaderProps {
    avatar: string;
    name: string;
    status: 'online' | 'offline';
}

export const ChatHeader = ({ avatar, name, status }: ChatHeaderProps) => {
    return (
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-surface-light p-4 dark:border-gray-700 dark:bg-surface-dark">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <img 
                        src={avatar}
                        alt={name}
                        className="h-12 w-12 rounded-full object-cover" 
                    />                    <span className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-surface-light ${status === 'online' ? 'bg-success' : 'bg-gray-400'} dark:border-surface-dark`} />
                </div>
                <div>
                    <p className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                        {name}
                    </p>
                    <p className={`text-sm ${status === 'online' ? 'text-success' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}>
                        {status === 'online' ? 'Online' : 'Offline'}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button 
                    aria-label="Search messages"
                    className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary-light hover:bg-background-light dark:text-text-secondary-dark dark:hover:bg-background-dark"
                >
                    <Search className="h-5 w-5" />
                </button>
                <button 
                    aria-label="More options"
                    className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary-light hover:bg-background-light dark:text-text-secondary-dark dark:hover:bg-background-dark"
                >
                    <MoreVertical className="h-5 w-5" />
                </button>            </div>
        </div>
    );
};