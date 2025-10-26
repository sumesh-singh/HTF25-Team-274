import { apiClient } from "../lib/api";
import { CreditTransaction } from "../types/api";

export const creditsService = {
  // Credit balance
  getBalance: (): Promise<{ balance: number }> =>
    apiClient.get("/credits/balance"),

  getTransactions: (
    page?: number,
    limit?: number,
    type?: string
  ): Promise<{ transactions: CreditTransaction[]; total: number }> =>
    apiClient.get("/credits/transactions", { page, limit, type }),

  // Credit purchases
  purchaseCredits: (
    packageId: string,
    paymentMethodId?: string
  ): Promise<{ clientSecret: string }> =>
    apiClient.post("/credits/purchase", { packageId, paymentMethodId }),

  getCreditPackages: (): Promise<
    Array<{
      id: string;
      credits: number;
      price: number;
      discount?: number;
      popular?: boolean;
    }>
  > => apiClient.get("/credits/packages"),

  // Credit transfers (if implemented)
  transferCredits: (
    recipientId: string,
    amount: number,
    message?: string
  ): Promise<CreditTransaction> =>
    apiClient.post("/credits/transfer", { recipientId, amount, message }),

  // Payment methods
  getPaymentMethods: (): Promise<
    Array<{
      id: string;
      type: string;
      last4: string;
      brand: string;
      expiryMonth: number;
      expiryYear: number;
      isDefault: boolean;
    }>
  > => apiClient.get("/payments/methods"),

  addPaymentMethod: (paymentMethodId: string): Promise<void> =>
    apiClient.post("/payments/methods", { paymentMethodId }),

  setDefaultPaymentMethod: (paymentMethodId: string): Promise<void> =>
    apiClient.put(`/payments/methods/${paymentMethodId}/default`),

  removePaymentMethod: (paymentMethodId: string): Promise<void> =>
    apiClient.delete(`/payments/methods/${paymentMethodId}`),

  // Referrals
  getReferralCode: (): Promise<{ code: string; bonusCredits: number }> =>
    apiClient.get("/credits/referral-code"),

  applyReferralCode: (code: string): Promise<{ bonusCredits: number }> =>
    apiClient.post("/credits/apply-referral", { code }),

  getReferralStats: (): Promise<{
    totalReferrals: number;
    successfulReferrals: number;
    totalBonusCredits: number;
  }> => apiClient.get("/credits/referral-stats"),
};
