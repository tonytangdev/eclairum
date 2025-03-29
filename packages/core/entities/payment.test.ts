import { faker } from "@faker-js/faker";
import { Payment, PaymentStatus } from "./payment";
import { RequiredFieldError } from "../errors/validation-errors";

describe("Payment", () => {
  // Helper function to create valid payment parameters with faker data
  const createValidPaymentParams = () => ({
    subscriptionId: faker.string.uuid(),
    amount: faker.number.int({ min: 100, max: 10000 }), // 1-100 dollars in cents
    status: PaymentStatus.SUCCEEDED,
    provider: faker.helpers.arrayElement(["stripe", "paypal", "braintree"]),
    providerPaymentId: `pi_${faker.string.alphanumeric(24)}`,
  });

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-01-01T12:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create a payment with minimum required properties", () => {
      // Arrange
      const params = createValidPaymentParams();

      // Act
      const payment = new Payment(params);

      // Assert
      expect(payment).toBeInstanceOf(Payment);
      expect(payment.getSubscriptionId()).toBe(params.subscriptionId);
      expect(payment.getAmount()).toBe(params.amount);
      expect(payment.getStatus()).toBe(params.status);
      expect(payment.getProvider()).toBe(params.provider);
      expect(payment.getProviderPaymentId()).toBe(params.providerPaymentId);
      expect(payment.getCurrency()).toBe("EUR");
      expect(payment.isRefunded()).toBe(false);
      expect(payment.getInvoiceUrl()).toBeNull();
      expect(payment.getPaymentMethodType()).toBeNull();
      expect(payment.getCardLastFour()).toBeNull();
      expect(payment.getCardBrand()).toBeNull();
      expect(payment.getRefundReason()).toBeNull();
      expect(payment.getId()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(payment.getCreatedAt()).toEqual(new Date("2024-01-01T12:00:00Z"));
      expect(payment.getUpdatedAt()).toEqual(new Date("2024-01-01T12:00:00Z"));
    });

    it("should create a payment with all custom properties", () => {
      // Arrange
      const id = faker.string.uuid();
      const subscriptionId = faker.string.uuid();
      const amount = 5999; // $59.99
      const currency = "EUR";
      const status = PaymentStatus.SUCCEEDED;
      const provider = "stripe";
      const providerPaymentId = `pi_${faker.string.alphanumeric(24)}`;
      const invoiceUrl = "https://stripe.com/invoice/123";
      const paymentMethodType = "card";
      const cardLastFour = "4242";
      const cardBrand = "visa";
      const refunded = false;
      const refundReason = null;
      const createdAt = new Date("2023-01-01");
      const updatedAt = new Date("2023-01-01");

      // Act
      const payment = new Payment({
        id,
        subscriptionId,
        amount,
        currency,
        status,
        provider,
        providerPaymentId,
        invoiceUrl,
        paymentMethodType,
        cardLastFour,
        cardBrand,
        refunded,
        refundReason,
        createdAt,
        updatedAt,
      });

      // Assert
      expect(payment.getId()).toBe(id);
      expect(payment.getSubscriptionId()).toBe(subscriptionId);
      expect(payment.getAmount()).toBe(amount);
      expect(payment.getCurrency()).toBe(currency);
      expect(payment.getStatus()).toBe(status);
      expect(payment.getProvider()).toBe(provider);
      expect(payment.getProviderPaymentId()).toBe(providerPaymentId);
      expect(payment.getInvoiceUrl()).toBe(invoiceUrl);
      expect(payment.getPaymentMethodType()).toBe(paymentMethodType);
      expect(payment.getCardLastFour()).toBe(cardLastFour);
      expect(payment.getCardBrand()).toBe(cardBrand);
      expect(payment.isRefunded()).toBe(refunded);
      expect(payment.getRefundReason()).toBe(refundReason);
      expect(payment.getCreatedAt()).toEqual(createdAt);
      expect(payment.getUpdatedAt()).toEqual(updatedAt);
    });

    it("should throw RequiredFieldError when subscriptionId is empty", () => {
      // Arrange
      const params = {
        ...createValidPaymentParams(),
        subscriptionId: "   ",
      };

      // Act & Assert
      expect(() => new Payment(params)).toThrow(RequiredFieldError);
      expect(() => new Payment(params)).toThrow(
        "subscriptionId is required for Payment",
      );
    });

    it("should throw Error when amount is negative", () => {
      // Arrange
      const params = {
        ...createValidPaymentParams(),
        amount: -500,
      };

      // Act & Assert
      expect(() => new Payment(params)).toThrow(
        "Payment amount cannot be negative",
      );
    });

    it("should throw Error when status is invalid", () => {
      // Arrange
      const params = createValidPaymentParams();
      const invalidStatus = "invalid_status" as PaymentStatus;

      // Act & Assert
      expect(
        () =>
          new Payment({
            ...params,
            status: invalidStatus,
          }),
      ).toThrow(`Invalid payment status: ${invalidStatus}`);
    });

    it("should throw RequiredFieldError when provider is empty", () => {
      // Arrange
      const params = {
        ...createValidPaymentParams(),
        provider: "",
      };

      // Act & Assert
      expect(() => new Payment(params)).toThrow(RequiredFieldError);
      expect(() => new Payment(params)).toThrow(
        "provider is required for Payment",
      );
    });

    it("should throw RequiredFieldError when providerPaymentId is empty", () => {
      // Arrange
      const params = {
        ...createValidPaymentParams(),
        providerPaymentId: "",
      };

      // Act & Assert
      expect(() => new Payment(params)).toThrow(RequiredFieldError);
      expect(() => new Payment(params)).toThrow(
        "providerPaymentId is required for Payment",
      );
    });

    it("should throw Error when cardLastFour is not exactly 4 digits", () => {
      // Arrange
      const params = {
        ...createValidPaymentParams(),
        cardLastFour: "123",
      };

      // Act & Assert
      expect(() => new Payment(params)).toThrow(
        "Card last four must be exactly 4 digits",
      );
    });

    it("should throw Error when currency format is invalid", () => {
      // Arrange
      const params = {
        ...createValidPaymentParams(),
        currency: "usd", // lowercase instead of uppercase
      };

      // Act & Assert
      expect(() => new Payment(params)).toThrow(
        "Currency must be a 3-letter code in uppercase",
      );
    });

    it("should throw RequiredFieldError when currency is empty", () => {
      // Arrange
      const params = {
        ...createValidPaymentParams(),
        currency: "",
      };

      // Act & Assert
      expect(() => new Payment(params)).toThrow(RequiredFieldError);
      expect(() => new Payment(params)).toThrow(
        "currency is required for Payment",
      );
    });
  });

  describe("getFormattedAmount", () => {
    it("should correctly format the amount with currency", () => {
      // Arrange
      const payment = new Payment({
        ...createValidPaymentParams(),
        amount: 1299,
        currency: "USD",
      });

      // Act
      const formattedAmount = payment.getFormattedAmount();

      // Assert
      expect(formattedAmount).toBe("12.99 USD");
    });
  });

  describe("updateStatus", () => {
    it("should update the status and update timestamp", () => {
      // Arrange
      const payment = new Payment(createValidPaymentParams());
      const newStatus = PaymentStatus.PENDING;
      const previousUpdatedAt = payment.getUpdatedAt();

      // Act
      payment.updateStatus(newStatus);

      // Assert
      expect(payment.getStatus()).toBe(newStatus);
      expect(payment.getUpdatedAt()).not.toBe(previousUpdatedAt);
      expect(payment.getUpdatedAt()).toEqual(new Date("2024-01-01T12:00:00Z"));
    });

    it("should throw Error when status is invalid", () => {
      // Arrange
      const payment = new Payment(createValidPaymentParams());
      const invalidStatus = "invalid_status" as PaymentStatus;

      // Act & Assert
      expect(() => payment.updateStatus(invalidStatus)).toThrow(
        `Invalid payment status: ${invalidStatus}`,
      );
    });
  });

  describe("markAsRefunded", () => {
    it("should mark payment as refunded and update status", () => {
      // Arrange
      const payment = new Payment(createValidPaymentParams());
      const reason = "Customer request";
      const previousUpdatedAt = payment.getUpdatedAt();

      // Act
      payment.markAsRefunded(reason);

      // Assert
      expect(payment.isRefunded()).toBe(true);
      expect(payment.getStatus()).toBe(PaymentStatus.REFUNDED);
      expect(payment.getRefundReason()).toBe(reason);
      expect(payment.getUpdatedAt()).not.toBe(previousUpdatedAt);
      expect(payment.getUpdatedAt()).toEqual(new Date("2024-01-01T12:00:00Z"));
    });

    it("should allow refund without providing a reason", () => {
      // Arrange
      const payment = new Payment(createValidPaymentParams());

      // Act
      payment.markAsRefunded();

      // Assert
      expect(payment.isRefunded()).toBe(true);
      expect(payment.getStatus()).toBe(PaymentStatus.REFUNDED);
      expect(payment.getRefundReason()).toBeNull();
    });
  });

  describe("updatePaymentMethod", () => {
    it("should update payment method information", () => {
      // Arrange
      const payment = new Payment(createValidPaymentParams());
      const paymentMethodType = "card";
      const cardLastFour = "4242";
      const cardBrand = "visa";
      const previousUpdatedAt = payment.getUpdatedAt();

      // Act
      payment.updatePaymentMethod(paymentMethodType, cardLastFour, cardBrand);

      // Assert
      expect(payment.getPaymentMethodType()).toBe(paymentMethodType);
      expect(payment.getCardLastFour()).toBe(cardLastFour);
      expect(payment.getCardBrand()).toBe(cardBrand);
      expect(payment.getUpdatedAt()).not.toBe(previousUpdatedAt);
      expect(payment.getUpdatedAt()).toEqual(new Date("2024-01-01T12:00:00Z"));
    });

    it("should allow setting payment method info to null", () => {
      // Arrange
      const payment = new Payment({
        ...createValidPaymentParams(),
        paymentMethodType: "card",
        cardLastFour: "4242",
        cardBrand: "visa",
      });
      const previousUpdatedAt = payment.getUpdatedAt();

      // Act
      payment.updatePaymentMethod(null, null, null);

      // Assert
      expect(payment.getPaymentMethodType()).toBeNull();
      expect(payment.getCardLastFour()).toBeNull();
      expect(payment.getCardBrand()).toBeNull();
      expect(payment.getUpdatedAt()).not.toBe(previousUpdatedAt);
      expect(payment.getUpdatedAt()).toEqual(new Date("2024-01-01T12:00:00Z"));
    });

    it("should throw Error when cardLastFour is not exactly 4 digits", () => {
      // Arrange
      const payment = new Payment(createValidPaymentParams());

      // Act & Assert
      expect(() =>
        payment.updatePaymentMethod("card", "12345", "visa"),
      ).toThrow("Card last four must be exactly 4 digits");
    });
  });

  describe("setInvoiceUrl", () => {
    it("should update invoice URL and update timestamp", () => {
      // Arrange
      const payment = new Payment(createValidPaymentParams());
      const invoiceUrl = "https://stripe.com/invoice/123";
      const previousUpdatedAt = payment.getUpdatedAt();

      // Act
      payment.setInvoiceUrl(invoiceUrl);

      // Assert
      expect(payment.getInvoiceUrl()).toBe(invoiceUrl);
      expect(payment.getUpdatedAt()).not.toBe(previousUpdatedAt);
      expect(payment.getUpdatedAt()).toEqual(new Date("2024-01-01T12:00:00Z"));
    });

    it("should allow setting invoice URL to null", () => {
      // Arrange
      const payment = new Payment({
        ...createValidPaymentParams(),
        invoiceUrl: "https://stripe.com/invoice/123",
      });
      const previousUpdatedAt = payment.getUpdatedAt();

      // Act
      payment.setInvoiceUrl(null);

      // Assert
      expect(payment.getInvoiceUrl()).toBeNull();
      expect(payment.getUpdatedAt()).not.toBe(previousUpdatedAt);
      expect(payment.getUpdatedAt()).toEqual(new Date("2024-01-01T12:00:00Z"));
    });
  });

  describe("isSuccessful", () => {
    it("should return true when payment status is SUCCEEDED and not refunded", () => {
      // Arrange
      const payment = new Payment({
        ...createValidPaymentParams(),
        status: PaymentStatus.SUCCEEDED,
        refunded: false,
      });

      // Act & Assert
      expect(payment.isSuccessful()).toBe(true);
    });

    it("should return false when payment is refunded", () => {
      // Arrange
      const payment = new Payment({
        ...createValidPaymentParams(),
        status: PaymentStatus.SUCCEEDED,
        refunded: true,
      });

      // Act & Assert
      expect(payment.isSuccessful()).toBe(false);
    });

    it("should return false when payment status is not SUCCEEDED", () => {
      // Arrange
      const payment = new Payment({
        ...createValidPaymentParams(),
        status: PaymentStatus.PENDING,
      });

      // Act & Assert
      expect(payment.isSuccessful()).toBe(false);
    });
  });

  describe("isPending", () => {
    it("should return true when payment status is PENDING", () => {
      // Arrange
      const payment = new Payment({
        ...createValidPaymentParams(),
        status: PaymentStatus.PENDING,
      });

      // Act & Assert
      expect(payment.isPending()).toBe(true);
    });

    it("should return false when payment status is not PENDING", () => {
      // Arrange
      const payment = new Payment({
        ...createValidPaymentParams(),
        status: PaymentStatus.SUCCEEDED,
      });

      // Act & Assert
      expect(payment.isPending()).toBe(false);
    });
  });

  describe("hasFailed", () => {
    it("should return true when payment status is FAILED", () => {
      // Arrange
      const payment = new Payment({
        ...createValidPaymentParams(),
        status: PaymentStatus.FAILED,
      });

      // Act & Assert
      expect(payment.hasFailed()).toBe(true);
    });

    it("should return false when payment status is not FAILED", () => {
      // Arrange
      const payment = new Payment({
        ...createValidPaymentParams(),
        status: PaymentStatus.SUCCEEDED,
      });

      // Act & Assert
      expect(payment.hasFailed()).toBe(false);
    });
  });
});
