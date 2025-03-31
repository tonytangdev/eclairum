import { type Subscription } from "../entities/subscription";
import { type SubscriptionRepository } from "../interfaces/subscription-repository.interface";
import { type UserRepository } from "../interfaces/user-repository.interface";

export interface FetchUserSubscriptionInput {
  userId: string;
}

export type FetchUserSubscriptionOutput = Subscription | null;

/**
 * @description Fetches the subscription for a given user.
 * @param {FetchUserSubscriptionInput} input - The input data containing the user ID.
 * @returns {Promise<FetchUserSubscriptionOutput>} The user's subscription or null if not found.
 * @throws {Error} If the user with the specified ID is not found.
 */
export class FetchUserSubscriptionUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  async execute(
    input: FetchUserSubscriptionInput,
  ): Promise<FetchUserSubscriptionOutput> {
    // 1. Validate user exists
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      // It's generally better practice for fetch use cases to return null
      // if the primary entity isn't found, rather than throwing.
      // Let the calling layer decide how to handle a non-existent user.
      // However, if the business logic dictates a user *must* exist
      // for this operation to be valid, throwing an error is appropriate.
      // Sticking to the original request's implied logic for now.
      throw new Error(`User with ID ${input.userId} not found.`);
    }

    // 2. Fetch subscription by user ID
    const subscription = await this.subscriptionRepository.findByUserId(
      input.userId,
    );

    // 3. Return the subscription (or null if none exists)
    return subscription;
  }
}
