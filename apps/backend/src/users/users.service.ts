import { CreateUserUseCase } from '@flash-me/core/use-cases';
import { Injectable } from '@nestjs/common';
import { RelationalUserRepository } from './infrastructure/relational/user.repository';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: RelationalUserRepository) {}

  createUser(dto: CreateUserDto) {
    const useCase = new CreateUserUseCase(this.userRepository);
    return useCase.execute(dto);
  }
}
