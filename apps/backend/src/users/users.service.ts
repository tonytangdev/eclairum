import { CreateUserUseCase } from '@flash-me/core/use-cases';
import { Injectable } from '@nestjs/common';
import { RelationalUserRepository } from './infrastructure/relational/user.repository';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: RelationalUserRepository) {}

  createUser() {
    const useCase = new CreateUserUseCase(this.userRepository);
    return;
  }
}
