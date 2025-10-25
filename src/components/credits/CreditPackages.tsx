import { Diamond } from 'lucide-react';

interface CreditPackage {
    id: string;
    name: string;
    credits: number;
    price: number;
    popular?: boolean;
    features: string[];
}

interface CreditPackagesProps {
    packages: CreditPackage[];
    onSelect: (pkg: CreditPackage) => void;
}

export const CreditPackages = ({ packages, onSelect }: CreditPackagesProps) => {
    return (
        <div className="flex flex-col rounded-2xl border border-border-light bg-card-light dark:border-border-dark dark:bg-card-dark">
            <div className="border-b border-border-light p-6 dark:border-border-dark">
                <h2 className="text-lg font-bold">Buy Credits</h2>
                <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    Choose a credit package that suits your needs
                </p>
            </div>
            <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
                {packages.map((pkg) => (
                    <div 
                        key={pkg.id}
                        className={`relative flex flex-col rounded-xl border ${
                            pkg.popular
                                ? 'border-primary bg-primary/5 dark:bg-primary/10'
                                : 'border-border-light dark:border-border-dark'
                        } p-6`}
                    >
                        {pkg.popular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1">
                                <p className="text-xs font-semibold text-white">Most Popular</p>
                            </div>
                        )}
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold">{pkg.name}</h3>
                                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                                    {pkg.credits} credits
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <Diamond className="h-6 w-6" />
                            </div>
                        </div>
                        <ul className="mb-6 flex flex-col gap-3">
                            {pkg.features.map((feature, index) => (
                                <li key={index} className="flex items-center gap-2 text-sm">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                        <div className="mt-auto">
                            <p className="mb-4 text-center text-2xl font-bold">${pkg.price}</p>
                            <button
                                onClick={() => onSelect(pkg)}
                                className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                                    pkg.popular
                                        ? 'bg-primary text-white hover:bg-primary/90'
                                        : 'border border-border-light bg-white hover:bg-gray-50 dark:border-border-dark dark:bg-card-dark dark:hover:bg-gray-800'
                                }`}
                            >
                                Choose Package
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};