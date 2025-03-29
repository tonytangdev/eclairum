import { faker } from "@faker-js/faker";
import {
  PaymentMethod,
  PaymentMethodType,
  PaymentProvider,
} from "./payment-method";
import { RequiredFieldError } from "../errors/validation-errors";
import {
  InvalidCardDetailsError,
  InvalidProviderError,
  InvalidProviderIdError,
} from "../errors/payment-method-errors";

describe("PaymentMethod", () => {
  // Helper function to create valid payment method parameters with faker data
  const createValidPaymentMethodParams = () => ({
    userId: faker.string.uuid(),
    provider: PaymentProvider.STRIPE,
    providerPaymentMethodId: `pm_${faker.string.alphanumeric(24)}`,
    type: PaymentMethodType.CARD,
    lastFour: faker.finance.creditCardNumber("####"),
    expiryMonth: String(faker.number.int({ min: 1, max: 12 })),
    expiryYear: String(faker.date.future().getFullYear()),
    cardBrand: "visa",
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
    it("should create a payment method with minimum required properties", () => {
      // Arrange
      const params = {
        userId: faker.string.uuid(),
        provider: PaymentProvider.STRIPE,
        providerPaymentMethodId: `pm_${faker.string.alphanumeric(24)}`,
        type: PaymentMethodType.CARD,
      };

      // Act
      const paymentMethod = new PaymentMethod(params);

      // Assert
      expect(paymentMethod).toBeInstanceOf(PaymentMethod);
      expect(paymentMethod.getUserId()).toBe(params.userId);
      expect(paymentMethod.getProvider()).toBe(params.provider);
      expect(paymentMethod.getProviderPaymentMethodId()).toBe(
        params.providerPaymentMethodId,
      );
      expect(paymentMethod.getType()).toBe(params.type);
      expect(paymentMethod.isDefaultMethod()).toBe(false);
      expect(paymentMethod.getLastFour()).toBeNull();
      expect(paymentMethod.getExpiryMonth()).toBeNull();
      expect(paymentMethod.getExpiryYear()).toBeNull();
      expect(paymentMethod.getCardBrand()).toBeNull();
      expect(paymentMethod.getId()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(paymentMethod.getCreatedAt()).toEqual(
        new Date("2024-01-01T12:00:00Z"),
      );
      expect(paymentMethod.getUpdatedAt()).toEqual(
        new Date("2024-01-01T12:00:00Z"),
      );
    });

    it("should create a payment method with all custom properties", () => {
      // Arrange
      const id = faker.string.uuid();
      const userId = faker.string.uuid();
      const provider = PaymentProvider.STRIPE;
      const providerPaymentMethodId = `pm_${faker.string.alphanumeric(24)}`;
      const type = PaymentMethodType.CARD;
      const isDefault = true;
      const lastFour = "4242";
      const expiryMonth = "12";
      const expiryYear = "2025";
      const cardBrand = "visa";
      const createdAt = new Date("2023-01-01");
      const updatedAt = new Date("2023-01-02");

      // Act
      const paymentMethod = new PaymentMethod({
        id,
        userId,
        provider,
        providerPaymentMethodId,
        type,
        isDefault,
        lastFour,
        expiryMonth,
        expiryYear,
        cardBrand,
        createdAt,
        updatedAt,
      });

      // Assert
      expect(paymentMethod.getId()).toBe(id);
      expect(paymentMethod.getUserId()).toBe(userId);
      expect(paymentMethod.getProvider()).toBe(provider);
      expect(paymentMethod.getProviderPaymentMethodId()).toBe(
        providerPaymentMethodId,
      );
      expect(paymentMethod.getType()).toBe(type);
      expect(paymentMethod.isDefaultMethod()).toBe(isDefault);
      expect(paymentMethod.getLastFour()).toBe(lastFour);
      expect(paymentMethod.getExpiryMonth()).toBe(expiryMonth);
      expect(paymentMethod.getExpiryYear()).toBe(expiryYear);
      expect(paymentMethod.getCardBrand()).toBe(cardBrand);
      expect(paymentMethod.getCreatedAt()).toBe(createdAt);
      expect(paymentMethod.getUpdatedAt()).toBe(updatedAt);
    });

    it("should throw RequiredFieldError when userId is empty", () => {
      // Arrange
      const params = {
        ...createValidPaymentMethodParams(),
        userId: "   ",
      };

      // Act & Assert
      expect(() => new PaymentMethod(params)).toThrow(RequiredFieldError);
      expect(() => new PaymentMethod(params)).toThrow(
        "userId is required for PaymentMethod",
      );
    });

    it("should throw InvalidProviderError when provider is empty", () => {
      // Arrange
      const params = {
        ...createValidPaymentMethodParams(),
        provider: "",
      };

      // Act & Assert
      expect(() => new PaymentMethod(params)).toThrow(InvalidProviderError);
      expect(() => new PaymentMethod(params)).toThrow(
        "Invalid payment provider:",
      );
    });

    it("should throw InvalidProviderIdError when providerPaymentMethodId is empty", () => {
      // Arrange
      const params = {
        ...createValidPaymentMethodParams(),
        providerPaymentMethodId: "",
      };

      // Act & Assert
      expect(() => new PaymentMethod(params)).toThrow(InvalidProviderIdError);
      expect(() => new PaymentMethod(params)).toThrow(
        "Provider payment method ID cannot be empty",
      );
    });

    it("should throw InvalidCardDetailsError when lastFour is invalid for card type", () => {
      // Arrange
      const params = {
        ...createValidPaymentMethodParams(),
        type: PaymentMethodType.CARD,
        lastFour: "123", // Not 4 digits
      };

      // Act & Assert
      expect(() => new PaymentMethod(params)).toThrow(InvalidCardDetailsError);
      expect(() => new PaymentMethod(params)).toThrow(
        "Invalid card details: last four digits must be exactly 4 digits",
      );
    });

    it("should throw InvalidCardDetailsError when expiryMonth is invalid format", () => {
      // Arrange
      const params = {
        ...createValidPaymentMethodParams(),
        expiryMonth: "123", // Not 1-2 digits
      };

      // Act & Assert
      expect(() => new PaymentMethod(params)).toThrow(InvalidCardDetailsError);
      expect(() => new PaymentMethod(params)).toThrow(
        "Invalid card details: expiry month must be 1 or 2 digits",
      );
    });

    it("should throw InvalidCardDetailsError when expiryMonth is out of range", () => {
      // Arrange
      const params = {
        ...createValidPaymentMethodParams(),
        expiryMonth: "13", // Not between 1-12
      };

      // Act & Assert
      expect(() => new PaymentMethod(params)).toThrow(InvalidCardDetailsError);
      expect(() => new PaymentMethod(params)).toThrow(
        "Invalid card details: expiry month must be between 1 and 12",
      );
    });

    it("should throw InvalidCardDetailsError when expiryYear is invalid format", () => {
      // Arrange
      const params = {
        ...createValidPaymentMethodParams(),
        expiryYear: "20", // Not 4 digits
      };

      // Act & Assert
      expect(() => new PaymentMethod(params)).toThrow(InvalidCardDetailsError);
      expect(() => new PaymentMethod(params)).toThrow(
        "Invalid card details: expiry year must be 4 digits",
      );
    });
  });

  describe("setAsDefault", () => {
    it("should set the payment method as default and update timestamp", () => {
      // Arrange
      const paymentMethod = new PaymentMethod({
        ...createValidPaymentMethodParams(),
        isDefault: false,
      });
      const previousUpdatedAt = paymentMethod.getUpdatedAt();

      // Act
      paymentMethod.setAsDefault(true);

      // Assert
      expect(paymentMethod.isDefaultMethod()).toBe(true);
      expect(paymentMethod.getUpdatedAt()).not.toBe(previousUpdatedAt);
      expect(paymentMethod.getUpdatedAt()).toEqual(
        new Date("2024-01-01T12:00:00Z"),
      );
    });
  });

  describe("getFormattedExpiry", () => {
    it("should return formatted expiry date when month and year are available", () => {
      // Arrange
      const paymentMethod = new PaymentMethod({
        ...createValidPaymentMethodParams(),
        expiryMonth: "5",
        expiryYear: "2025",
      });

      // Act
      const formattedExpiry = paymentMethod.getFormattedExpiry();

      // Assert
      expect(formattedExpiry).toBe("05/25");
    });

    it("should pad the month with leading zero when needed", () => {
      // Arrange
      const paymentMethod = new PaymentMethod({
        ...createValidPaymentMethodParams(),
        expiryMonth: "1",
        expiryYear: "2025",
      });

      // Act
      const formattedExpiry = paymentMethod.getFormattedExpiry();

      // Assert
      expect(formattedExpiry).toBe("01/25");
    });

    it("should return null when expiry month is not available", () => {
      // Arrange
      const paymentMethod = new PaymentMethod({
        ...createValidPaymentMethodParams(),
        expiryMonth: null,
        expiryYear: "2025",
      });

      // Act
      const formattedExpiry = paymentMethod.getFormattedExpiry();

      // Assert
      expect(formattedExpiry).toBeNull();
    });

    it("should return null when expiry year is not available", () => {
      // Arrange
      const paymentMethod = new PaymentMethod({
        ...createValidPaymentMethodParams(),
        expiryMonth: "12",
        expiryYear: null,
      });

      // Act
      const formattedExpiry = paymentMethod.getFormattedExpiry();

      // Assert
      expect(formattedExpiry).toBeNull();
    });
  });

  describe("updateCardDetails", () => {
    it("should update card details and update timestamp", () => {
      // Arrange
      const paymentMethod = new PaymentMethod({
        ...createValidPaymentMethodParams(),
        lastFour: "4242",
      });
      const newLastFour = "5678";
      const newExpiryMonth = "10";
      const newExpiryYear = "2030";
      const newCardBrand = "mastercard";
      const previousUpdatedAt = paymentMethod.getUpdatedAt();

      // Act
      paymentMethod.updateCardDetails(
        newLastFour,
        newExpiryMonth,
        newExpiryYear,
        newCardBrand,
      );

      // Assert
      expect(paymentMethod.getLastFour()).toBe(newLastFour);
      expect(paymentMethod.getExpiryMonth()).toBe(newExpiryMonth);
      expect(paymentMethod.getExpiryYear()).toBe(newExpiryYear);
      expect(paymentMethod.getCardBrand()).toBe(newCardBrand);
      expect(paymentMethod.getUpdatedAt()).not.toBe(previousUpdatedAt);
      expect(paymentMethod.getUpdatedAt()).toEqual(
        new Date("2024-01-01T12:00:00Z"),
      );
    });

    it("should allow setting card details to null", () => {
      // Arrange
      const paymentMethod = new PaymentMethod({
        ...createValidPaymentMethodParams(),
        lastFour: "4242",
        expiryMonth: "12",
        expiryYear: "2025",
        cardBrand: "visa",
      });

      // Act
      paymentMethod.updateCardDetails(null, null, null, null);

      // Assert
      expect(paymentMethod.getLastFour()).toBeNull();
      expect(paymentMethod.getExpiryMonth()).toBeNull();
      expect(paymentMethod.getExpiryYear()).toBeNull();
      expect(paymentMethod.getCardBrand()).toBeNull();
    });

    it("should throw InvalidCardDetailsError when trying to update for non-card payment method", () => {
      // Arrange
      const paymentMethod = new PaymentMethod({
        ...createValidPaymentMethodParams(),
        type: PaymentMethodType.BANK_ACCOUNT,
      });

      // Act & Assert
      expect(() =>
        paymentMethod.updateCardDetails("1234", "12", "2025", "visa"),
      ).toThrow(InvalidCardDetailsError);
      expect(() =>
        paymentMethod.updateCardDetails("1234", "12", "2025", "visa"),
      ).toThrow(
        "Invalid card details: cannot update card details for non-card payment method",
      );
    });

    it("should throw InvalidCardDetailsError when lastFour is invalid", () => {
      // Arrange
      const paymentMethod = new PaymentMethod(createValidPaymentMethodParams());

      // Act & Assert
      expect(() =>
        paymentMethod.updateCardDetails("123", "12", "2025", "visa"),
      ).toThrow(InvalidCardDetailsError);
      expect(() =>
        paymentMethod.updateCardDetails("123", "12", "2025", "visa"),
      ).toThrow(
        "Invalid card details: last four digits must be exactly 4 digits",
      );
    });

    it("should throw InvalidCardDetailsError when expiryMonth is invalid format", () => {
      // Arrange
      const paymentMethod = new PaymentMethod(createValidPaymentMethodParams());

      // Act & Assert
      expect(() =>
        paymentMethod.updateCardDetails("1234", "123", "2025", "visa"),
      ).toThrow(InvalidCardDetailsError);
      expect(() =>
        paymentMethod.updateCardDetails("1234", "123", "2025", "visa"),
      ).toThrow("Invalid card details: expiry month must be 1 or 2 digits");
    });

    it("should throw InvalidCardDetailsError when expiryMonth is out of range", () => {
      // Arrange
      const paymentMethod = new PaymentMethod(createValidPaymentMethodParams());

      // Act & Assert
      expect(() =>
        paymentMethod.updateCardDetails("1234", "13", "2025", "visa"),
      ).toThrow(InvalidCardDetailsError);
      expect(() =>
        paymentMethod.updateCardDetails("1234", "13", "2025", "visa"),
      ).toThrow("Invalid card details: expiry month must be between 1 and 12");
    });

    it("should throw InvalidCardDetailsError when expiryYear is invalid format", () => {
      // Arrange
      const paymentMethod = new PaymentMethod(createValidPaymentMethodParams());

      // Act & Assert
      expect(() =>
        paymentMethod.updateCardDetails("1234", "12", "25", "visa"),
      ).toThrow(InvalidCardDetailsError);
      expect(() =>
        paymentMethod.updateCardDetails("1234", "12", "25", "visa"),
      ).toThrow("Invalid card details: expiry year must be 4 digits");
    });
  });

  describe("isCard, isBankAccount, isDigitalWallet", () => {
    it("should correctly identify card payment methods", () => {
      // Arrange
      const paymentMethod = new PaymentMethod({
        ...createValidPaymentMethodParams(),
        type: PaymentMethodType.CARD,
      });

      // Act & Assert
      expect(paymentMethod.isCard()).toBe(true);
      expect(paymentMethod.isBankAccount()).toBe(false);
      expect(paymentMethod.isDigitalWallet()).toBe(false);
    });

    it("should correctly identify bank account payment methods", () => {
      // Arrange
      const paymentMethod = new PaymentMethod({
        ...createValidPaymentMethodParams(),
        type: PaymentMethodType.BANK_ACCOUNT,
      });

      // Act & Assert
      expect(paymentMethod.isCard()).toBe(false);
      expect(paymentMethod.isBankAccount()).toBe(true);
      expect(paymentMethod.isDigitalWallet()).toBe(false);
    });

    it("should correctly identify digital wallet payment methods", () => {
      // Arrange
      const paymentMethod = new PaymentMethod({
        ...createValidPaymentMethodParams(),
        type: PaymentMethodType.DIGITAL_WALLET,
      });

      // Act & Assert
      expect(paymentMethod.isCard()).toBe(false);
      expect(paymentMethod.isBankAccount()).toBe(false);
      expect(paymentMethod.isDigitalWallet()).toBe(true);
    });
  });

  describe("isExpired", () => {
    it("should return true when card is expired", () => {
      // Arrange - Set current date to 2024-01-01
      jest.setSystemTime(new Date("2024-01-01T12:00:00Z"));

      const paymentMethod = new PaymentMethod({
        ...createValidPaymentMethodParams(),
        type: PaymentMethodType.CARD,
        expiryMonth: "12",
        expiryYear: "2023",
      });

      // Act & Assert
      expect(paymentMethod.isExpired()).toBe(true);
    });

    it("should return true when card expired in the current month", () => {
      // Arrange - Set current date to 2024-02-15
      jest.setSystemTime(new Date("2024-02-15T12:00:00Z"));

      const paymentMethod = new PaymentMethod({
        ...createValidPaymentMethodParams(),
        type: PaymentMethodType.CARD,
        expiryMonth: "1", // January
        expiryYear: "2024",
      });

      // Act & Assert
      expect(paymentMethod.isExpired()).toBe(true);
    });

    it("should return false when card expires in the future", () => {
      // Arrange - Set current date to 2024-01-01
      jest.setSystemTime(new Date("2024-01-01T12:00:00Z"));

      const paymentMethod = new PaymentMethod({
        ...createValidPaymentMethodParams(),
        type: PaymentMethodType.CARD,
        expiryMonth: "12",
        expiryYear: "2024", // Future year
      });

      // Act & Assert
      expect(paymentMethod.isExpired()).toBe(false);
    });

    it("should return false when card expires in the current year but future month", () => {
      // Arrange - Set current date to 2024-01-15
      jest.setSystemTime(new Date("2024-01-15T12:00:00Z"));

      const paymentMethod = new PaymentMethod({
        ...createValidPaymentMethodParams(),
        type: PaymentMethodType.CARD,
        expiryMonth: "2", // February
        expiryYear: "2024", // Current year
      });

      // Act & Assert
      expect(paymentMethod.isExpired()).toBe(false);
    });

    it("should return false for non-card payment methods", () => {
      // Arrange
      const paymentMethod = new PaymentMethod({
        ...createValidPaymentMethodParams(),
        type: PaymentMethodType.BANK_ACCOUNT,
      });

      // Act & Assert
      expect(paymentMethod.isExpired()).toBe(false);
    });

    it("should return false when expiry information is incomplete", () => {
      // Arrange
      const paymentMethod = new PaymentMethod({
        ...createValidPaymentMethodParams(),
        type: PaymentMethodType.CARD,
        expiryMonth: null,
        expiryYear: "2025",
      });

      // Act & Assert
      expect(paymentMethod.isExpired()).toBe(false);
    });
  });

  describe("getMaskedRepresentation", () => {
    it("should return proper representation for card payment methods with brand", () => {
      // Arrange
      const paymentMethod = new PaymentMethod({
        ...createValidPaymentMethodParams(),
        type: PaymentMethodType.CARD,
        lastFour: "4242",
        cardBrand: "visa",
      });

      // Act
      const maskedRepresentation = paymentMethod.getMaskedRepresentation();

      // Assert
      expect(maskedRepresentation).toBe("visa •••• 4242");
    });

    it("should return proper representation for card payment methods without brand", () => {
      // Arrange
      const paymentMethod = new PaymentMethod({
        ...createValidPaymentMethodParams(),
        type: PaymentMethodType.CARD,
        lastFour: "4242",
        cardBrand: null,
      });

      // Act
      const maskedRepresentation = paymentMethod.getMaskedRepresentation();

      // Assert
      expect(maskedRepresentation).toBe("•••• 4242");
    });

    it("should return proper representation for bank account payment methods", () => {
      // Arrange
      const paymentMethod = new PaymentMethod({
        ...createValidPaymentMethodParams(),
        type: PaymentMethodType.BANK_ACCOUNT,
        lastFour: "6789",
      });

      // Act
      const maskedRepresentation = paymentMethod.getMaskedRepresentation();

      // Assert
      expect(maskedRepresentation).toBe("Bank account ending in 6789");
    });

    it("should return proper representation for digital wallet payment methods", () => {
      // Arrange
      const paymentMethod = new PaymentMethod({
        ...createValidPaymentMethodParams(),
        type: PaymentMethodType.DIGITAL_WALLET,
        provider: PaymentProvider.PAYPAL,
      });

      // Act
      const maskedRepresentation = paymentMethod.getMaskedRepresentation();

      // Assert
      expect(maskedRepresentation).toBe("Paypal");
    });

    it("should return 'Unknown payment method' for unrecognized types", () => {
      // Arrange
      const paymentMethod = new PaymentMethod({
        ...createValidPaymentMethodParams(),
        type: PaymentMethodType.CARD,
      });

      // This would normally throw, but for test purposes we need to bypass type safety
      // Using Object.defineProperty to modify the private field without TypeScript errors
      Object.defineProperty(paymentMethod, "type", {
        value: "unknown_type",
        writable: true,
      });

      // Act
      const maskedRepresentation = paymentMethod.getMaskedRepresentation();

      // Assert
      expect(maskedRepresentation).toBe("Unknown payment method");
    });
  });
});
