import { Wallet, Clock, TrendingUp, Gift, ArrowUpRight } from 'lucide-react';

interface CreditBalanceProps {
    balance: number;
    currency?: string;
}

export const CreditBalance = ({ balance, currency = 'Credits' }: CreditBalanceProps) => {
    return (
        <div className="flex flex-col gap-6 rounded-2xl border border-border-light bg-card-light p-6 dark:border-border-dark dark:bg-card-dark">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Current Balance</h2>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Wallet className="h-5 w-5" />
                </div>
            </div>
            <div>
                <p className="mb-1 text-3xl font-bold">{balance.toLocaleString()}</p>
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">{currency}</p>
            </div>
interface CreditBalanceProps {
    balance: number;
    currency?: string;
    onBuyCredits?: () => void;
}

export const CreditBalance = ({ balance, currency = 'Credits', onBuyCredits }: CreditBalanceProps) => {
    return (
        <div className="flex flex-col gap-6 rounded-2xl border border-border-light bg-card-light p-6 dark:border-border-dark dark:bg-card-dark">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Current Balance</h2>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Wallet className="h-5 w-5" />
                </div>
            </div>
            <div>
                <p className="mb-1 text-3xl font-bold">{balance.toLocaleString()}</p>
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">{currency}</p>
            </div>
            <button 
                type="button"
                onClick={onBuyCredits}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
                Buy Credits
                <ArrowUpRight className="h-4 w-4" />
            </button>
        </div>
    );
};        </div>
    );
};

interface CreditStatsProps {
    weeklyEarned: number;
    weeklySpent: number;
    totalEarned: number;
}

export const CreditStats = ({ weeklyEarned, weeklySpent, totalEarned }: CreditStatsProps) => {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-4 rounded-xl border border-border-light bg-card-light p-4 dark:border-border-dark dark:bg-card-dark">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
                    <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">Weekly Earned</p>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">+{weeklyEarned}</p>
                </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-border-light bg-card-light p-4 dark:border-border-dark dark:bg-card-dark">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
                    <Clock className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">Weekly Spent</p>
                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">-{weeklySpent}</p>
                </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-border-light bg-card-light p-4 dark:border-border-dark dark:bg-card-dark">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                    <Gift className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">Total Earned</p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{totalEarned}</p>
                </div>
            </div>
        </div>
    );
};