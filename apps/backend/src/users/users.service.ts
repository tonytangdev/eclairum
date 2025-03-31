import { CreateUserUseCase } from '@eclairum/core/use-cases';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepositoryImpl } from '../repositories/users/user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { SubscriptionRepositoryImpl } from '../repositories/subscriptions/subscription.repository';
import { StripeService } from '../subscriptions/stripe.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepositoryImpl,
    private readonly subscriptionRepository: SubscriptionRepositoryImpl,
    private readonly stripeService: StripeService,
  ) {}

  createUser(dto: CreateUserDto) {
    const useCase = new CreateUserUseCase(this.userRepository);
    return useCase.execute(dto);
  }

  async getStripeCustomerId(userId: string) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const subscription = await this.subscriptionRepository.findByUserId(userId);

    if (!subscription) {
      throw new NotFoundException(`No subscription found for user ${userId}`);
    }

    return { stripeCustomerId: subscription.stripeCustomerId };
  }

  async createStripeCustomer(userId: string) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const customerResult = await this.stripeService.findOrCreateCustomer({
      userId: user.getId(),
      email: user.getEmail(),
    });

    return { stripeCustomerId: customerResult.customerId };
  }
}
