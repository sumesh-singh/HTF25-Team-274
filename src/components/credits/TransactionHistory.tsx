import { ArrowDown, ArrowUp } from 'lucide-react';

interface Transaction {
    id: string;
    type: 'earned' | 'spent';
    amount: number;
    description: string;
    date: Date;
    user?: {
        name: string;
        avatar: string;
    };
}

interface TransactionHistoryProps {
    transactions: Transaction[];
}

export const TransactionHistory = ({ transactions }: TransactionHistoryProps) => {
    return (
        <div className="flex flex-col rounded-2xl border border-border-light bg-card-light dark:border-border-dark dark:bg-card-dark">
            <div className="border-b border-border-light p-6 dark:border-border-dark">
                <h2 className="text-lg font-bold">Transaction History</h2>
            </div>
            <div className="flex flex-col divide-y divide-border-light dark:divide-border-dark">
                {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center gap-4 p-4">
                        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                            transaction.type === 'earned'
                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400'
                                : 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400'
                        }`}>
                            {transaction.type === 'earned' ? (
                                <ArrowUp className="h-5 w-5" />
                            ) : (
                                <ArrowDown className="h-5 w-5" />
                            )}
                        </div>
                        <div className="flex flex-1 items-center justify-between">
                            <div className="flex flex-col">
                                <p className="font-medium">{transaction.description}</p>
                                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                                    {transaction.user?.name || 'System'}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <p className={`text-base font-semibold ${
                                    transaction.type === 'earned'
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-amber-600 dark:text-amber-400'
                                }`}>
                                    {transaction.type === 'earned' ? '+' : '-'}{transaction.amount}
                                </p>
                                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                                    {transaction.date.toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};