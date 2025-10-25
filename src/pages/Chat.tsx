import React from 'react';
import { Search, MoreVertical, Paperclip, Send, Smile } from 'lucide-react';

const Chat = () => {
    // This is a simplified version of the chat interface.
    // A real implementation would involve state management for messages, conversations, etc.
    return (
        <div className="flex h-[calc(100vh-150px)] w-full flex-row overflow-hidden rounded-xl border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark">
            {/* Left Pane: Conversation List */}
            <div className="flex w-full max-w-xs flex-shrink-0 flex-col border-r border-border-light dark:border-border-dark">
                {/* Header */}
                <div className="flex h-auto flex-col justify-between p-4">
                    <h1 className="text-xl font-bold">Messages</h1>
                </div>
                {/* Search */}
                <div className="border-b border-t border-border-light px-4 py-3 dark:border-border-dark">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-light-secondary dark:text-text-dark-secondary" />
                        <input className="w-full rounded-lg border-border-light bg-background-light py-2 pl-10 pr-4 text-sm focus:border-primary focus:ring-primary dark:border-border-dark dark:bg-background-dark" placeholder="Search conversations" />
                    </div>
                </div>
                {/* Conversation List */}
                <div className="flex flex-auto flex-col overflow-y-auto">
                    {/* Active Item */}
                    <div className="flex cursor-pointer items-center gap-4 border-l-4 border-primary bg-primary/10 px-4 py-3 dark:bg-primary/20">
                        {/* ... conversation item content ... */}
                        <p>Jane Smith</p>
                    </div>
                    {/* Other Items */}
                    <div className="flex cursor-pointer items-center gap-4 px-4 py-3 hover:bg-background-light dark:hover:bg-background-dark"><p>Project Team</p></div>
                    <div className="flex cursor-pointer items-center gap-4 px-4 py-3 hover:bg-background-light dark:hover:bg-background-dark"><p>Emily Carter</p></div>
                </div>
            </div>

            {/* Right Pane: Active Chat Window */}
            <div className="relative flex flex-auto flex-col bg-background-light dark:bg-background-dark">
                {/* Chat Header */}
                <div className="flex flex-shrink-0 items-center justify-between border-b border-border-light bg-card-light p-4 dark:border-border-dark dark:bg-card-dark">
                    <p className="text-lg font-bold">Jane Smith</p>
                    <button><MoreVertical /></button>
                </div>
                {/* Message Area */}
                <div className="flex-auto overflow-y-auto p-6">
                    {/* ... messages ... */}
                    <p>Messages will appear here.</p>
                </div>
                {/* Message Composer */}
                <div className="flex-shrink-0 border-t border-border-light bg-card-light p-4 dark:border-border-dark dark:bg-card-dark">
                    <div className="flex w-full items-center gap-2 rounded-lg bg-background-light px-2 dark:bg-background-dark">
                        <button><Smile /></button>
                        <button><Paperclip /></button>
                        <textarea className="flex-1 resize-none border-0 bg-transparent py-3 text-sm placeholder:text-text-light-secondary focus:ring-0 dark:placeholder:text-text-dark-secondary" placeholder="Type a message..." rows={1}></textarea>
                        <button className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white"><Send /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;
