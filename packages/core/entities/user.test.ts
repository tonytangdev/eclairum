import { faker } from "@faker-js/faker";
import { randomUUID } from "crypto";
import { User } from "./user";

describe("User", () => {
  // Helper to create a valid user
  const createValidUserProps = () => ({
    email: faker.internet.email(),
  });

  it("should create a user with minimum required properties", () => {
    const props = createValidUserProps();
    const user = new User(props);

    expect(user).toBeInstanceOf(User);
    expect(user.getEmail()).toBe(props.email.toLowerCase());
    expect(user.getId()).toEqual(expect.any(String));
    expect(user.getCreatedAt()).toEqual(expect.any(Date));
    expect(user.getUpdatedAt()).toEqual(expect.any(Date));
    expect(user.getDeletedAt()).toBe(null);
    expect(user.isDeleted()).toBe(false);
  });

  it("should create a user with all custom properties", () => {
    const id = randomUUID();
    const email = faker.internet.email();
    const createdAt = new Date(2023, 1, 1);
    const updatedAt = new Date(2023, 1, 2);
    const deletedAt = new Date(2023, 1, 3);

    const user = new User({
      id,
      email,
      createdAt,
      updatedAt,
      deletedAt,
    });

    expect(user.getId()).toBe(id);
    expect(user.getEmail()).toBe(email.toLowerCase());
    expect(user.getCreatedAt()).toBe(createdAt);
    expect(user.getUpdatedAt()).toBe(updatedAt);
    expect(user.getDeletedAt()).toBe(deletedAt);
    expect(user.isDeleted()).toBe(true);
  });

  it("should throw error when email is empty", () => {
    expect(() => {
      new User({
        email: "",
      });
    }).toThrow("Email is required");
  });

  it("should throw error when email format is invalid", () => {
    expect(() => {
      new User({
        email: "invalid-email",
      });
    }).toThrow("Invalid email format");
  });

  it("should convert email to lowercase", () => {
    const mixedCaseEmail = "Test.User@Example.com";

    const user = new User({
      email: mixedCaseEmail,
    });

    expect(user.getEmail()).toBe(mixedCaseEmail.toLowerCase());
  });

  it("should soft delete a user", () => {
    const user = new User(createValidUserProps());
    expect(user.isDeleted()).toBe(false);
    expect(user.getDeletedAt()).toBe(null);

    user.softDelete();

    expect(user.isDeleted()).toBe(true);
    expect(user.getDeletedAt()).toBeInstanceOf(Date);
  });

  it("should restore a deleted user", () => {
    const user = new User(createValidUserProps());
    user.softDelete();
    expect(user.isDeleted()).toBe(true);

    user.restore();

    expect(user.isDeleted()).toBe(false);
    expect(user.getDeletedAt()).toBe(null);
  });
});
