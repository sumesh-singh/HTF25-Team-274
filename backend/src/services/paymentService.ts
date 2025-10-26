import Stripe from "stripe";
import { creditService } from "./creditService";
import { TransactionType } from "@prisma/client";
import logger from "@/utils/logger";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number; // in cents
  description: string;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: "starter_pack",
    name: "Starter Pack",
    credits: 100,
    price: 1000, // $10.00
    description: "100 credits for $10",
  },
  {
    id: "value_pack",
    name: "Value Pack",
    credits: 500,
    price: 4500, // $45.00
    description: "500 credits for $45 (10% bonus)",
  },
  {
    id: "premium_pack",
    name: "Premium Pack",
    credits: 1000,
    price: 8000, // $80.00
    description: "1000 credits for $80 (20% bonus)",
  },
];

export class PaymentService {
  /**
   * Get available credit packages
   */
  getCreditPackages(): CreditPackage[] {
    return CREDIT_PACKAGES;
  }

  /**
   * Create a payment intent for credit purchase
   */
  async createPaymentIntent(
    userId: string,
    packageId: string,
    customerEmail?: string
  ): Promise<{
    clientSecret: string;
    paymentIntentId: string;
    package: CreditPackage;
  }> {
    try {
      const creditPackage = CREDIT_PACKAGES.find((pkg) => pkg.id === packageId);
      if (!creditPackage) {
        throw new Error("Invalid credit package");
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: creditPackage.price,
        currency: "usd",
        metadata: {
          userId,
          packageId,
          credits: creditPackage.credits.toString(),
          type: "credit_purchase",
        },
        receipt_email: customerEmail,
        description: `SkillSync Credits: ${creditPackage.description}`,
      });

      logger.info(
        `Payment intent created: ${paymentIntent.id} for user ${userId}`
      );

      return {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
        package: creditPackage,
      };
    } catch (error) {
      logger.error("Error creating payment intent:", error);
      throw error;
    }
  }

  /**
   * Handle successful payment and award credits
   */
  async handleSuccessfulPayment(paymentIntentId: string): Promise<void> {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId
      );

      if (paymentIntent.status !== "succeeded") {
        throw new Error("Payment not successful");
      }

      const { userId, packageId, credits } = paymentIntent.metadata;
      const creditPackage = CREDIT_PACKAGES.find((pkg) => pkg.id === packageId);

      if (!creditPackage) {
        throw new Error("Invalid credit package in payment metadata");
      }

      // Award credits to user
      await creditService.createTransaction({
        userId,
        type: TransactionType.PURCHASED,
        amount: parseInt(credits),
        description: `Credit purchase: ${creditPackage.description}`,
        stripePaymentId: paymentIntentId,
      });

      logger.info(
        `Credits awarded: ${credits} credits to user ${userId} for payment ${paymentIntentId}`
      );
    } catch (error) {
      logger.error("Error handling successful payment:", error);
      throw error;
    }
  }

  /**
   * Create a customer in Stripe
   */
  async createCustomer(email: string, name?: string): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          source: "skillsync_platform",
        },
      });

      logger.info(`Stripe customer created: ${customer.id} for ${email}`);
      return customer;
    } catch (error) {
      logger.error("Error creating Stripe customer:", error);
      throw error;
    }
  }

  /**
   * Get customer's payment methods
   */
  async getPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: "card",
      });

      return paymentMethods.data;
    } catch (error) {
      logger.error("Error getting payment methods:", error);
      throw error;
    }
  }

  /**
   * Attach payment method to customer
   */
  async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string
  ): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await stripe.paymentMethods.attach(
        paymentMethodId,
        {
          customer: customerId,
        }
      );

      logger.info(
        `Payment method ${paymentMethodId} attached to customer ${customerId}`
      );
      return paymentMethod;
    } catch (error) {
      logger.error("Error attaching payment method:", error);
      throw error;
    }
  }

  /**
   * Detach payment method from customer
   */
  async detachPaymentMethod(
    paymentMethodId: string
  ): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);

      logger.info(`Payment method ${paymentMethodId} detached`);
      return paymentMethod;
    } catch (error) {
      logger.error("Error detaching payment method:", error);
      throw error;
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(
    payload: string | Buffer,
    signature: string
  ): Promise<void> {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      logger.info(`Stripe webhook received: ${event.type}`);

      switch (event.type) {
        case "payment_intent.succeeded":
          await this.handleSuccessfulPayment(event.data.object.id);
          break;

        case "payment_intent.payment_failed":
          logger.warn(`Payment failed: ${event.data.object.id}`);
          // Could implement notification to user here
          break;

        case "customer.created":
          logger.info(`Customer created: ${event.data.object.id}`);
          break;

        default:
          logger.info(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error) {
      logger.error("Error handling Stripe webhook:", error);
      throw error;
    }
  }

  /**
   * Create a refund for a payment
   */
  async createRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: string
  ): Promise<Stripe.Refund> {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount,
        reason: reason as Stripe.RefundCreateParams.Reason,
        metadata: {
          source: "skillsync_platform",
        },
      });

      logger.info(
        `Refund created: ${refund.id} for payment ${paymentIntentId}`
      );
      return refund;
    } catch (error) {
      logger.error("Error creating refund:", error);
      throw error;
    }
  }

  /**
   * Get payment history for a customer
   */
  async getPaymentHistory(customerId: string): Promise<Stripe.PaymentIntent[]> {
    try {
      const paymentIntents = await stripe.paymentIntents.list({
        customer: customerId,
        limit: 100,
      });

      return paymentIntents.data;
    } catch (error) {
      logger.error("Error getting payment history:", error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();
