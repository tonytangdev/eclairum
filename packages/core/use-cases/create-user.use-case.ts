import { User } from "../entities/user";
import { UserAlreadyExistsError } from "../errors/user-errors";
import { UserService } from "../interfaces/user-service.interface";

type CreateUserUseCaseRequest = {
  email: string;
};

type CreateUserUseCaseResponse = {
  user: User;
};

export class CreateUserUseCase {
  constructor(private readonly userService: UserService) {}

  async execute({
    email,
  }: CreateUserUseCaseRequest): Promise<CreateUserUseCaseResponse> {
    // Check if user with email already exists
    const userWithSameEmail = await this.userService.getUserByEmail(email);

    if (userWithSameEmail) {
      throw new UserAlreadyExistsError(email);
    }

    // Create new user
    const user = new User({ email });

    // Save user using service
    const savedUser = await this.userService.createUser(user);

    return {
      user: savedUser,
    };
  }
}
