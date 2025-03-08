import { CreateUserUseCase } from '@flash-me/core/use-cases';
import { Injectable } from '@nestjs/common';
import { UserRepositoryImpl } from './infrastructure/relational/user.repository';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepositoryImpl) {}

  createUser(dto: CreateUserDto) {
    const useCase = new CreateUserUseCase(this.userRepository);
    return useCase.execute(dto);
  }
}
