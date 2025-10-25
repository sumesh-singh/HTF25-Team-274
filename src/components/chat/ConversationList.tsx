import { Search } from 'lucide-react';

interface ConversationListItemProps {
    id: string;
    avatar: string;
    name: string;
    lastMessage?: string;
    timestamp: string;
    unreadCount?: number;
    isTyping?: boolean;
    isOnline?: boolean;
    isActive?: boolean;
    onClick?: () => void;
}

export const ConversationListItem = ({
    avatar,
    name,
    lastMessage,
    timestamp,
    unreadCount,
    isTyping,
    isOnline,
    isActive,
    onClick
}: ConversationListItemProps) => {
    return (
        <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick?.();
                }
            }}
            className={`flex cursor-pointer items-center gap-4 px-4 py-3 ${
                isActive 
                    ? 'border-l-4 border-primary bg-primary/10 dark:bg-primary/20' 
                    : 'hover:bg-background-light dark:hover:bg-background-dark'
            }`}
            onClick={onClick}
        >            <div className="relative">
                <div 
                    className="h-14 w-14 rounded-full bg-cover bg-center bg-no-repeat" 
                    style={{ backgroundImage: `url(${avatar})` }}
                />
                {isOnline !== undefined && (
                    <span className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-surface-light ${
                        isOnline ? 'bg-success' : 'bg-gray-400'
                    } dark:border-surface-dark`} />
                )}
            </div>
            <div className="flex-1 overflow-hidden">
                <div className="flex items-baseline justify-between">
                    <p className={`truncate text-base ${
                        isActive ? 'font-semibold' : 'font-medium'
                    } leading-normal text-text-primary-light dark:text-text-primary-dark`}>
                        {name}
                    </p>
                    <p className={`text-xs ${
                        isActive ? 'font-medium text-primary' : 'font-normal text-text-secondary-light dark:text-text-secondary-dark'
                    } leading-normal`}>
                        {timestamp}
                    </p>
                </div>
                <div className="flex items-center justify-between">
                    <p className={`truncate text-sm font-normal leading-normal ${
                        isTyping 
                            ? 'text-primary' 
                            : 'text-text-secondary-light dark:text-text-secondary-dark'
                    }`}>
                        {isTyping ? 'Typing...' : lastMessage}
                    </p>
                    {unreadCount && unreadCount > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                            {unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

interface ConversationListProps {
    conversations: Array<Omit<ConversationListItemProps, 'isActive' | 'onClick'>>;
    activeConversationId?: string;
    onConversationSelect: (id: string) => void;
}

export const ConversationList = ({ 
    conversations, 
    activeConversationId,
    onConversationSelect
}: ConversationListProps) => {
    return (
        <div className="flex w-full max-w-xs flex-shrink-0 flex-col border-r border-gray-200 bg-surface-light dark:border-gray-700 dark:bg-surface-dark">
            {/* Header */}
            <div className="flex h-auto flex-col justify-between p-4">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="h-12 w-12 rounded-full bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url("/images/avatar.jpg")` }} />
                            <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-surface-light bg-success dark:border-surface-dark" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-base font-bold leading-normal text-text-primary-light dark:text-text-primary-dark">John Doe</h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="border-b border-t border-gray-200 px-4 py-3 dark:border-gray-700">
                <label className="flex h-10 w-full min-w-40 flex-col" aria-label="Search conversations">
                    <div className="flex h-full w-full flex-1 items-stretch rounded-lg">
                        <div className="flex items-center justify-center rounded-l-lg border-r-0 bg-background-light pl-3 text-text-secondary-light dark:bg-background-dark dark:text-text-secondary-dark">
                            <Search className="h-5 w-5" />
                        </div>
                        <input 
                            className="form-input flex h-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg rounded-l-none border-none border-l-0 bg-background-light px-2 pl-2 text-sm font-normal leading-normal text-text-primary-light placeholder:text-text-secondary-light focus:border-none focus:outline-0 focus:ring-0 dark:bg-background-dark dark:text-text-primary-dark dark:placeholder:text-text-secondary-dark" 
                            placeholder="Search conversations"
                        />
                    </div>
                </label>
            </div>

            {/* Conversation List */}
            <div className="flex flex-auto flex-col overflow-y-auto">
                {conversations.map((conversation) => (
                    <ConversationListItem 
                        key={conversation.id}
                        {...conversation}
                        isActive={activeConversationId === conversation.id}
                        onClick={() => onConversationSelect(conversation.id)}
                    />
                ))}
            </div>
        </div>
    );
};