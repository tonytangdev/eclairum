import { faker } from "@faker-js/faker";
import { randomUUID } from "crypto";
import { PlanFeature, LimitType } from "./plan-feature";
import { RequiredFieldError } from "../errors/validation-errors";
import {
  InvalidLimitTypeError,
  InvalidNumericLimitValueError,
  InvalidBooleanLimitValueError,
  InvalidStorageLimitValueError,
  InvalidLimitTypeAccessError,
} from "../errors/plan-feature-errors";
import { Plan, BillingInterval } from "./plan";
import { Feature } from "./feature";

describe("PlanFeature", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date());
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  const createValidPlanFeatureParams = () => ({
    planId: randomUUID(),
    featureId: randomUUID(),
    limitType: LimitType.NUMERIC,
    limitValue: "100",
  });

  describe("constructor", () => {
    it("should create a plan feature with valid parameters", () => {
      const params = createValidPlanFeatureParams();
      const planFeature = new PlanFeature(params);

      expect(planFeature.getPlanId()).toBe(params.planId);
      expect(planFeature.getFeatureId()).toBe(params.featureId);
      expect(planFeature.getLimitType()).toBe(params.limitType);
      expect(planFeature.getLimitValue()).toBe(params.limitValue);
      expect(planFeature.getId()).toEqual(expect.any(String));
      expect(planFeature.getCreatedAt()).toEqual(expect.any(Date));
      expect(planFeature.getUpdatedAt()).toEqual(expect.any(Date));
    });

    it("should throw RequiredFieldError when planId is empty", () => {
      const params = { ...createValidPlanFeatureParams(), planId: "" };
      expect(() => new PlanFeature(params)).toThrow(RequiredFieldError);
      expect(() => new PlanFeature(params)).toThrow(
        "planId is required for PlanFeature",
      );
    });

    it("should throw InvalidLimitTypeError for invalid limit type", () => {
      const params = {
        ...createValidPlanFeatureParams(),
        limitType: "invalid-type" as LimitType,
      };
      expect(() => new PlanFeature(params)).toThrow(InvalidLimitTypeError);
    });

    it("should throw InvalidNumericLimitValueError for invalid numeric limit value", () => {
      const params = {
        ...createValidPlanFeatureParams(),
        limitType: LimitType.NUMERIC,
        limitValue: "abc",
      };
      expect(() => new PlanFeature(params)).toThrow(
        InvalidNumericLimitValueError,
      );
    });

    it("should throw InvalidBooleanLimitValueError for invalid boolean limit value", () => {
      const params = {
        ...createValidPlanFeatureParams(),
        limitType: LimitType.BOOLEAN,
        limitValue: "yes",
      };
      expect(() => new PlanFeature(params)).toThrow(
        InvalidBooleanLimitValueError,
      );
    });

    it("should throw InvalidStorageLimitValueError for invalid storage limit value", () => {
      const params = {
        ...createValidPlanFeatureParams(),
        limitType: LimitType.STORAGE,
        limitValue: "-100",
      };
      expect(() => new PlanFeature(params)).toThrow(
        InvalidStorageLimitValueError,
      );
    });

    it("should throw RequiredFieldError when featureId is empty", () => {
      const params = { ...createValidPlanFeatureParams(), featureId: "" };
      expect(() => new PlanFeature(params)).toThrow(RequiredFieldError);
      expect(() => new PlanFeature(params)).toThrow(
        "featureId is required for PlanFeature",
      );
    });

    it("should throw RequiredFieldError when limitValue is empty", () => {
      const params = { ...createValidPlanFeatureParams(), limitValue: "" };
      expect(() => new PlanFeature(params)).toThrow(RequiredFieldError);
      expect(() => new PlanFeature(params)).toThrow(
        "limitValue is required for PlanFeature",
      );
    });
  });

  describe("limit getters", () => {
    it("should return numeric limit value as a number", () => {
      const planFeature = new PlanFeature({
        ...createValidPlanFeatureParams(),
        limitType: LimitType.NUMERIC,
        limitValue: "100",
      });
      expect(planFeature.getNumericLimit()).toBe(100);
    });

    it("should return boolean limit value as a boolean", () => {
      const planFeature = new PlanFeature({
        ...createValidPlanFeatureParams(),
        limitType: LimitType.BOOLEAN,
        limitValue: "true",
      });
      expect(planFeature.getBooleanLimit()).toBe(true);
    });

    it("should return storage limit value as a number", () => {
      const planFeature = new PlanFeature({
        ...createValidPlanFeatureParams(),
        limitType: LimitType.STORAGE,
        limitValue: "1048576",
      });
      expect(planFeature.getStorageLimit()).toBe(1048576);
    });

    it("should throw InvalidLimitTypeAccessError when accessing numeric limit for boolean type", () => {
      const planFeature = new PlanFeature({
        ...createValidPlanFeatureParams(),
        limitType: LimitType.BOOLEAN,
        limitValue: "true",
      });
      expect(() => planFeature.getNumericLimit()).toThrow(
        InvalidLimitTypeAccessError,
      );
      expect(() => planFeature.getNumericLimit()).toThrow(
        "Cannot get numeric limit for boolean limit type",
      );
    });

    it("should throw InvalidLimitTypeAccessError when accessing boolean limit for numeric type", () => {
      const planFeature = new PlanFeature({
        ...createValidPlanFeatureParams(),
        limitType: LimitType.NUMERIC,
        limitValue: "100",
      });
      expect(() => planFeature.getBooleanLimit()).toThrow(
        InvalidLimitTypeAccessError,
      );
      expect(() => planFeature.getBooleanLimit()).toThrow(
        "Cannot get boolean limit for numeric limit type",
      );
    });

    it("should throw InvalidLimitTypeAccessError when accessing storage limit for numeric type", () => {
      const planFeature = new PlanFeature({
        ...createValidPlanFeatureParams(),
        limitType: LimitType.NUMERIC,
        limitValue: "100",
      });
      expect(() => planFeature.getStorageLimit()).toThrow(
        InvalidLimitTypeAccessError,
      );
      expect(() => planFeature.getStorageLimit()).toThrow(
        "Cannot get storage limit for numeric limit type",
      );
    });
  });

  describe("update methods", () => {
    it("should update limit type and value", () => {
      const planFeature = new PlanFeature(createValidPlanFeatureParams());
      const newLimitType = LimitType.BOOLEAN;
      const newLimitValue = "true";

      planFeature.updateLimit(newLimitType, newLimitValue);

      expect(planFeature.getLimitType()).toBe(newLimitType);
      expect(planFeature.getLimitValue()).toBe(newLimitValue);
    });

    it("should throw InvalidLimitTypeError when updating to invalid limit type", () => {
      const planFeature = new PlanFeature(createValidPlanFeatureParams());
      expect(() =>
        planFeature.updateLimit("invalid-type" as LimitType, "100"),
      ).toThrow(InvalidLimitTypeError);
    });

    it("should throw InvalidBooleanLimitValueError when updating to invalid limit value", () => {
      const planFeature = new PlanFeature(createValidPlanFeatureParams());
      expect(() => planFeature.updateLimit(LimitType.BOOLEAN, "yes")).toThrow(
        InvalidBooleanLimitValueError,
      );
    });

    it("should throw RequiredFieldError when setting empty planId", () => {
      const planFeature = new PlanFeature(createValidPlanFeatureParams());
      expect(() => planFeature.setPlanId("")).toThrow(RequiredFieldError);
      expect(() => planFeature.setPlanId("")).toThrow(
        "planId is required for PlanFeature",
      );
    });

    it("should throw RequiredFieldError when setting empty featureId", () => {
      const planFeature = new PlanFeature(createValidPlanFeatureParams());
      expect(() => planFeature.setFeatureId("")).toThrow(RequiredFieldError);
      expect(() => planFeature.setFeatureId("")).toThrow(
        "featureId is required for PlanFeature",
      );
    });

    describe("setPlanId", () => {
      it("should update planId and updatedAt timestamp", () => {
        // Arrange
        const planFeature = new PlanFeature(createValidPlanFeatureParams());
        const originalPlanId = planFeature.getPlanId();
        const originalUpdatedAt = planFeature.getUpdatedAt();
        const newPlanId = randomUUID();

        jest.advanceTimersByTime(100); // Advance time to ensure timestamp difference

        // Act
        planFeature.setPlanId(newPlanId);

        // Assert
        expect(planFeature.getPlanId()).not.toBe(originalPlanId);
        expect(planFeature.getPlanId()).toBe(newPlanId);
        expect(planFeature.getUpdatedAt().getTime()).toBeGreaterThan(
          originalUpdatedAt.getTime(),
        );
      });

      it("should throw RequiredFieldError when setting empty planId", () => {
        // Arrange
        const planFeature = new PlanFeature(createValidPlanFeatureParams());

        // Act & Assert
        expect(() => planFeature.setPlanId("")).toThrow(RequiredFieldError);
        expect(() => planFeature.setPlanId("")).toThrow(
          "planId is required for PlanFeature",
        );
      });
    });

    describe("setFeatureId", () => {
      it("should update featureId and updatedAt timestamp", () => {
        // Arrange
        const planFeature = new PlanFeature(createValidPlanFeatureParams());
        const originalFeatureId = planFeature.getFeatureId();
        const originalUpdatedAt = planFeature.getUpdatedAt();
        const newFeatureId = randomUUID();

        jest.advanceTimersByTime(100); // Advance time to ensure timestamp difference

        // Act
        planFeature.setFeatureId(newFeatureId);

        // Assert
        expect(planFeature.getFeatureId()).not.toBe(originalFeatureId);
        expect(planFeature.getFeatureId()).toBe(newFeatureId);
        expect(planFeature.getUpdatedAt().getTime()).toBeGreaterThan(
          originalUpdatedAt.getTime(),
        );
      });

      it("should throw RequiredFieldError when setting empty featureId", () => {
        // Arrange
        const planFeature = new PlanFeature(createValidPlanFeatureParams());

        // Act & Assert
        expect(() => planFeature.setFeatureId("")).toThrow(RequiredFieldError);
        expect(() => planFeature.setFeatureId("")).toThrow(
          "featureId is required for PlanFeature",
        );
      });
    });
  });

  describe("createFromPlanAndFeature", () => {
    it("should create a plan feature from Plan and Feature objects", () => {
      const plan = new Plan({
        name: faker.commerce.productName(),
        priceAmount: faker.number.int({ min: 500, max: 10000 }),
        billingInterval: BillingInterval.MONTHLY,
      });

      const feature = new Feature({
        name: faker.commerce.productName(),
        key: "test_feature",
      });

      const limitType = LimitType.NUMERIC;
      const limitValue = "100";

      const planFeature = PlanFeature.createFromPlanAndFeature(
        plan,
        feature,
        limitType,
        limitValue,
      );

      expect(planFeature.getPlanId()).toBe(plan.getId());
      expect(planFeature.getFeatureId()).toBe(feature.getId());
      expect(planFeature.getLimitType()).toBe(limitType);
      expect(planFeature.getLimitValue()).toBe(limitValue);
    });
  });

  describe("validateLimitValue", () => {
    it("should throw InvalidLimitTypeError for unsupported limit type", () => {
      const params = createValidPlanFeatureParams();
      const unsupportedLimitType = "unsupported_type" as LimitType;

      expect(
        () =>
          new PlanFeature({
            ...params,
            limitType: unsupportedLimitType,
            limitValue: "100",
          }),
      ).toThrow(InvalidLimitTypeError);
    });

    it("should throw InvalidLimitTypeError when reaching default case in switch statement", () => {
      // Arrange
      const planFeature = new PlanFeature(createValidPlanFeatureParams());

      // Temporarily extend the LimitType enum with a new value
      const originalLimitTypeValues = Object.values(LimitType);

      // Mock Object.values to return our extended enum
      const originalObjectValues = Object.values;
      Object.values = jest.fn().mockImplementation((obj) => {
        if (obj === LimitType) {
          return [...originalLimitTypeValues, "new_type"];
        }
        return originalObjectValues(obj);
      });

      // Act & Assert
      expect(() =>
        planFeature.updateLimit("new_type" as LimitType, "100"),
      ).toThrow(InvalidLimitTypeError);
      expect(() =>
        planFeature.updateLimit("new_type" as LimitType, "100"),
      ).toThrow("Invalid limit type: new_type");

      // Cleanup
      Object.values = originalObjectValues;
    });
  });
});
