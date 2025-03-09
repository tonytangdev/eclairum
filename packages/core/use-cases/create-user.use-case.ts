import { User } from "../entities/user";
import { UserAlreadyExistsError } from "../errors/user-errors";
import { UserRepository } from "../interfaces/user-repository.interface";

type CreateUserUseCaseRequest = {
  email: string;
  id?: string;
};

type CreateUserUseCaseResponse = {
  user: User;
};

export class CreateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute({
    email,
    id,
  }: CreateUserUseCaseRequest): Promise<CreateUserUseCaseResponse> {
    await this.checkIfUserExists(email);
    const user = this.createUser(email, id);
    const savedUser = await this.saveUser(user);

    return { user: savedUser };
  }

  private async checkIfUserExists(email: string): Promise<void> {
    const userWithSameEmail = await this.userRepository.findByEmail(email);

    if (userWithSameEmail) {
      throw new UserAlreadyExistsError(email);
    }
  }

  private createUser(email: string, id?: string): User {
    return new User({ email, id });
  }

  private async saveUser(user: User): Promise<User> {
    return await this.userRepository.save(user);
  }
}
