import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';

@Controller('users')
export class UsersController {
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createUser() {
    return;
  }
}
