import { useState } from 'react';
import { ChatHeader } from '../components/chat/ChatHeader';
import { ConversationList, ConversationListItem } from '../components/chat/ConversationList';
import { MessageComposer } from '../components/chat/MessageComposer';
import { ChatMessage } from '../components/chat/ChatMessage';
import { subDays } from 'date-fns';

// Mock data
const conversations = [
    {
        id: '1',
        name: 'Jane Smith',
        avatar: '/images/avatars/avatar1.jpg',
        lastMessage: 'Looking forward to our next session!',
        timestamp: '10:42 AM',
        unreadCount: 2,
        isTyping: true,
        isOnline: true,
    },
    {
        id: '2',
        name: 'Project Team',
        avatar: '/images/avatars/avatar2.jpg',
        lastMessage: 'Great progress on the project!',
        timestamp: '9:15 AM',
        unreadCount: 0,
        isOnline: true,
    },
    {
        id: '3',
        name: 'Emily Carter',
        avatar: '/images/avatars/avatar3.jpg',
        lastMessage: 'Thanks for the Python tips!',
        timestamp: 'Yesterday',
        unreadCount: 0,
        isOnline: false,
    },
];

const messages = [
    {
        id: '1',
        type: 'received' as const,
        message: 'Hi! I checked your profile and I think we could learn a lot from each other. Would you be interested in a skill exchange session?',
        timestamp: subDays(new Date(), 1),
        avatar: conversations[0].avatar,
        status: 'read' as const,
    },
    {
        id: '2',
        type: 'sent' as const,
        message: "Hello! Thanks for reaching out. I'd be happy to exchange skills. What specific areas are you interested in?",
        timestamp: subDays(new Date(), 1),
        avatar: '/images/avatars/user.jpg',
        status: 'read' as const,
    },
    {
        id: '3',
        type: 'received' as const,
        message: "I'm particularly interested in learning more about Python and data analysis. I noticed you have experience in those areas. In exchange, I could help you with UX design principles and prototyping tools.",
        timestamp: new Date(),
        avatar: conversations[0].avatar,
        status: 'delivered' as const,
    },
    {
        id: '4',
        type: 'sent' as const,
        message: "That sounds perfect! I've been wanting to improve my UX design skills. How about we schedule a session this week?",
        timestamp: new Date(),
        avatar: '/images/avatars/user.jpg',
        status: 'sent' as const,
    },
];

const Chat = () => {
    const [activeConversation, setActiveConversation] = useState(conversations[0]);

    const handleSendMessage = (message: string) => {
        // In a real app, this would send the message to a backend
        console.log('Sending message:', message);
    };

    return (
        <div className="flex h-[calc(100vh-150px)] w-full flex-row overflow-hidden rounded-xl border border-border-light bg-card-light dark:border-border-dark dark:bg-card-dark">
            <ConversationList
                conversations={conversations}
                activeConversationId={activeConversation.id}
                onConversationSelect={(id) => {
                    const conversation = conversations.find(c => c.id === id);
                    if (conversation) setActiveConversation(conversation);
                }}
            />

            <div className="relative flex flex-auto flex-col bg-background-light dark:bg-background-dark">
                <ChatHeader
                    avatar={activeConversation.avatar}
                    name={activeConversation.name}
                    status={activeConversation.isOnline ? 'online' : 'offline'}
                />

                <div className="flex-auto overflow-y-auto p-6 space-y-6">
                    {messages.map((message) => (
                        <ChatMessage key={message.id} {...message} />
                    ))}
                </div>

                <MessageComposer onSend={handleSendMessage} />
            </div>
        </div>
    );
};

export default Chat;
