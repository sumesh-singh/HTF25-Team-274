import { Send, Smile, PaperclipIcon } from 'lucide-react';

interface MessageComposerProps {
    onSend: (message: string) => void;
    disabled?: boolean;
}

export const MessageComposer = ({ onSend, disabled }: MessageComposerProps) => {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        const message = formData.get('message') as string;

        if (message.trim()) {
            onSend(message.trim());
            form.reset();
        }
    };

    return (
        <form 
            onSubmit={handleSubmit}
            className="flex-shrink-0 border-t border-gray-200 bg-surface-light p-4 dark:border-gray-700 dark:bg-surface-dark"
        >
            <div className="flex w-full items-center gap-2 rounded-lg bg-background-light px-2 dark:bg-background-dark">
                <button 
                    type="button"
                    disabled={disabled}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary-light hover:bg-gray-200 dark:text-text-secondary-dark dark:hover:bg-gray-600 disabled:opacity-50"
                >
                    <Smile className="h-5 w-5" />
                </button>
                <button 
                    type="button"
                    disabled={disabled}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary-light hover:bg-gray-200 dark:text-text-secondary-dark dark:hover:bg-gray-600 disabled:opacity-50"
                >
                    <PaperclipIcon className="h-5 w-5" />
                </button>
                <textarea 
                    name="message"
                    disabled={disabled}
                    className="flex-1 resize-none border-0 bg-transparent py-3 text-sm placeholder:text-text-secondary-light focus:ring-0 dark:placeholder:text-text-secondary-dark disabled:opacity-50" 
                    placeholder="Type a message..." 
                    rows={1}
                />
                <button 
                    type="submit"
                    disabled={disabled}
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
                >
                    <Send className="h-5 w-5" />
                </button>
            </div>
        </form>
    );
};