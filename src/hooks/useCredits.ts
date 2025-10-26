import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { creditsService } from "../services/creditsService";

export const useCreditBalance = () => {
  return useQuery({
    queryKey: ["credit-balance"],
    queryFn: creditsService.getBalance,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

export const useCreditTransactions = (page = 1, limit = 20, type?: string) => {
  return useQuery({
    queryKey: ["credit-transactions", page, limit, type],
    queryFn: () => creditsService.getTransactions(page, limit, type),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreditPackages = () => {
  return useQuery({
    queryKey: ["credit-packages"],
    queryFn: creditsService.getCreditPackages,
    staleTime: 30 * 60 * 1000, // 30 minutes - packages don't change often
  });
};

export const usePurchaseCredits = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      packageId,
      paymentMethodId,
    }: {
      packageId: string;
      paymentMethodId?: string;
    }) => creditsService.purchaseCredits(packageId, paymentMethodId),
    onSuccess: () => {
      // Invalidate credit balance and transactions
      queryClient.invalidateQueries({ queryKey: ["credit-balance"] });
      queryClient.invalidateQueries({ queryKey: ["credit-transactions"] });
    },
  });
};

export const useTransferCredits = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      recipientId,
      amount,
      message,
    }: {
      recipientId: string;
      amount: number;
      message?: string;
    }) => creditsService.transferCredits(recipientId, amount, message),
    onSuccess: () => {
      // Invalidate credit balance and transactions
      queryClient.invalidateQueries({ queryKey: ["credit-balance"] });
      queryClient.invalidateQueries({ queryKey: ["credit-transactions"] });
    },
  });
};

export const usePaymentMethods = () => {
  return useQuery({
    queryKey: ["payment-methods"],
    queryFn: creditsService.getPaymentMethods,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAddPaymentMethod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentMethodId: string) =>
      creditsService.addPaymentMethod(paymentMethodId),
    onSuccess: () => {
      // Invalidate payment methods
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
    },
  });
};

export const useSetDefaultPaymentMethod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentMethodId: string) =>
      creditsService.setDefaultPaymentMethod(paymentMethodId),
    onSuccess: () => {
      // Invalidate payment methods to update default status
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
    },
  });
};

export const useRemovePaymentMethod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentMethodId: string) =>
      creditsService.removePaymentMethod(paymentMethodId),
    onSuccess: () => {
      // Invalidate payment methods
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
    },
  });
};

export const useReferralCode = () => {
  return useQuery({
    queryKey: ["referral-code"],
    queryFn: creditsService.getReferralCode,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useApplyReferralCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => creditsService.applyReferralCode(code),
    onSuccess: () => {
      // Invalidate credit balance (bonus credits added)
      queryClient.invalidateQueries({ queryKey: ["credit-balance"] });
      queryClient.invalidateQueries({ queryKey: ["credit-transactions"] });
    },
  });
};

export const useReferralStats = () => {
  return useQuery({
    queryKey: ["referral-stats"],
    queryFn: creditsService.getReferralStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
