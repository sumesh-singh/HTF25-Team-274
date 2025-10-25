import { useState } from 'react';
import { CreditBalance, CreditStats } from '../components/credits/CreditStats';
import { TransactionHistory } from '../components/credits/TransactionHistory';
import { CreditPackages } from '../components/credits/CreditPackages';
import { subDays, subHours } from 'date-fns';

// Mock data
const mockTransactions = [
    {
        id: '1',
        type: 'earned' as const,
        amount: 50,
        description: 'Python Mentoring Session',
        date: subHours(new Date(), 2),
        user: {
            name: 'John Smith',
            avatar: 'https://via.placeholder.com/128/4F46E5/FFFFFF?text=JS',
        },
    },
    {
        id: '2',
        type: 'spent' as const,
        amount: 30,
        description: 'UX Design Session',
        date: subDays(new Date(), 1),
        user: {
            name: 'Sarah Wilson',
            avatar: 'https://via.placeholder.com/128/4F46E5/FFFFFF?text=SW',
        },
    },
    {
        id: '3',
        type: 'earned' as const,
        amount: 100,
        description: 'Credit Package Purchase',
        date: subDays(new Date(), 2),
    },
];

const creditPackages = [
    {
        id: 'basic',
        name: 'Basic',
        credits: 100,
        price: 10,
        features: [
            'Perfect for getting started',
            '30-day validity',
            'Access to basic mentoring',
        ],
    },
    {
        id: 'pro',
        name: 'Professional',
        credits: 500,
        price: 45,
        popular: true,
        features: [
            'Most popular choice',
            '60-day validity',
            'Priority matching',
            'Access to premium mentors',
        ],
    },
    {
        id: 'premium',
        name: 'Premium',
        credits: 1200,
        price: 99,
        features: [
            'Best value for money',
            '90-day validity',
            'Priority support',
            'Exclusive workshops access',
            'Custom learning paths',
        ],
    },
];

const Credits = () => {
    const handlePackageSelect = (pkg: any) => {
    const handlePackageSelect = (pkg: any) => {
        console.log('Selected package:', pkg);
        // Handle package selection (e.g., open payment modal)
    };

    return (
        <div className="space-y-8">
            <header className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-black tracking-tighter lg:text-4xl">Credit Management</h1>
                    <p className="text-text-light-secondary dark:text-text-dark-secondary">
                        Manage your SkillSync currency for learning sessions
                    </p>
                </div>
            </header>

            {/* Credit Stats Section */}
            <div className="grid gap-8 lg:grid-cols-3">
                <CreditBalance balance={1250} />
                <div className="lg:col-span-2">
                    <CreditStats 
                        weeklyEarned={150}
                        weeklySpent={80}
                        totalEarned={2000}
                    />
                </div>
            </div>

            {/* Transaction History */}
            <TransactionHistory transactions={mockTransactions} />

            {/* Credit Packages */}
            <CreditPackages 
                packages={creditPackages}
                onSelect={handlePackageSelect}
            />
        </div>
    );
};

export default Credits;
