import { Module } from '@nestjs/common';
import { UserAnswersController } from './user-answers.controller';
import { UserAnswersService } from './services/user-answers.service';
import { RepositoriesModule } from '../repositories/repositories.module';

@Module({
  imports: [RepositoriesModule],
  controllers: [UserAnswersController],
  providers: [UserAnswersService],
})
export class UserAnswersModule {}
