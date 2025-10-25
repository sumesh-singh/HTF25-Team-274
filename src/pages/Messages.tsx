import React from 'react';
import { NavLink } from 'react-router-dom';

const Messages: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-96 border-2 border-dashed border-border-light dark:border-border-dark rounded-xl">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">Messages Page</h1>
        <p className="text-text-light-secondary dark:text-text-dark-secondary">This page is under construction.</p>
        <p className="mt-4 text-text-light-secondary dark:text-text-dark-secondary">
          Check out the <NavLink to="/chat" className="text-primary underline">Chat Interface</NavLink> instead.
        </p>
      </div>
    </div>
  );
};

export default Messages;
