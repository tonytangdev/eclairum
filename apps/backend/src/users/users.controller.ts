import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Body,
  Get,
  Param,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Get(':userId/stripe-customer')
  async getStripeCustomerId(@Param('userId') userId: string) {
    return this.usersService.getStripeCustomerId(userId);
  }

  @Post(':userId/stripe-customer')
  @HttpCode(HttpStatus.CREATED)
  async createStripeCustomer(@Param('userId') userId: string) {
    return this.usersService.createStripeCustomer(userId);
  }
}
