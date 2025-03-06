import { User } from "../entities/user";
import { UserAlreadyExistsError } from "../errors/user-errors";
import { UserRepository } from "../interfaces/user-repository.interface";

type CreateUserUseCaseRequest = {
  email: string;
};

type CreateUserUseCaseResponse = {
  user: User;
};

export class CreateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute({
    email,
  }: CreateUserUseCaseRequest): Promise<CreateUserUseCaseResponse> {
    // Check if user with email already exists
    const userWithSameEmail = await this.userRepository.findByEmail(email);

    if (userWithSameEmail) {
      throw new UserAlreadyExistsError(email);
    }

    // Create new user
    const user = new User({ email });

    // Save user in repository
    const savedUser = await this.userRepository.create(user);

    return {
      user: savedUser,
    };
  }
}
