import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAnswerEntity } from './infrastructure/relational/entities/user-answer.entity';
import { UserAnswerRepositoryImpl } from './infrastructure/relational/repositories/user-answer.repository';
import { UserAnswersController } from './user-answers.controller';
import { UserAnswersService } from './services/user-answers.service';
import { AnswersModule } from '../answers/answers.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserAnswerEntity]),
    AnswersModule,
    UsersModule,
  ],
  controllers: [UserAnswersController],
  providers: [UserAnswerRepositoryImpl, UserAnswersService],
  exports: [UserAnswerRepositoryImpl],
})
export class UserAnswersModule {}
