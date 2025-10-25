import { Check, CheckSquare, Download, Image } from 'lucide-react';
import { format } from 'date-fns';

interface ChatMessageProps {
    type: 'sent' | 'received';
    message: string;
    timestamp: Date;
    avatar: string;
    attachments?: Array<{
        type: 'image' | 'file';
        name: string;
        size: string;
        url?: string;
    }>;
    linkPreview?: {
        title: string;
        domain: string;
        image: string;
    };
    status?: 'sent' | 'delivered' | 'read';
}

export const ChatMessage = ({ 
    type,
    message,
    timestamp,
    avatar,
    attachments,
    linkPreview,
    status 
}: ChatMessageProps) => {
    const isReceived = type === 'received';

    return (
        <div className={`flex items-end gap-3 ${isReceived ? '' : 'flex-row-reverse'}`}>
            <div className="h-8 w-8 flex-shrink-0 rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${avatar})` }} />
            <div className="flex max-w-md flex-col gap-2">
                <div className={`rounded-lg ${isReceived ? 'rounded-bl-none bg-surface-light dark:bg-surface-dark' : 'rounded-br-none bg-primary text-white'} p-3 shadow-sm`}>
                    <p className="text-sm">{message}</p>
                    {linkPreview && (
                        <div className="mt-2 overflow-hidden rounded-lg border border-primary/20 bg-surface-light text-text-primary-light dark:bg-surface-dark dark:text-text-primary-dark">
                            <div 
                                className="h-32 bg-cover bg-center" 
                                style={{ backgroundImage: `url(${linkPreview.image})` }}
                            />
                            <div className="p-3">
                                <p className="text-xs font-semibold uppercase text-text-secondary-light dark:text-text-secondary-dark">
                                    {linkPreview.domain}
                                </p>
                                <p className="text-sm font-bold">{linkPreview.title}</p>
                            </div>
                        </div>
                    )}
                </div>

                {attachments?.map((attachment, index) => (
                    <div 
                        key={index}
                        className="flex items-center gap-2 rounded-lg rounded-bl-none border border-gray-200 bg-surface-light p-2 dark:border-gray-700 dark:bg-surface-dark"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Image className="text-primary" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium">{attachment.name}</p>
                            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                {attachment.size}
                            </p>
                        </div>
                        <button 
                            onClick={() => attachment.url && window.open(attachment.url, '_blank')}
                            disabled={!attachment.url}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary-light hover:bg-background-light dark:text-text-secondary-dark dark:hover:bg-background-dark disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download className="h-5 w-5" />
                        </button>                    </div>
                ))}

                <div className={`flex items-center gap-1 ${isReceived ? 'justify-start' : 'justify-end'}`}>
                    <p className={`text-xs ${isReceived ? 'text-text-secondary-light dark:text-text-secondary-dark' : 'text-primary/70'}`}>
                        {format(timestamp, 'h:mm a')}
                    </p>
                    {status && !isReceived && (
                        status === 'read' ? (
                            <CheckSquare className="h-4 w-4 text-white" />
                        ) : (
                            <Check className="h-4 w-4 text-primary/70" />
                        )
                    )}
                </div>
            </div>
        </div>
    );
};