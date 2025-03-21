import { Module } from '@nestjs/common';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './services/questions.service';
import { UnitOfWorkModule } from '../unit-of-work/unit-of-work.module';
import { RepositoriesModule } from '../repositories/repositories.module';

@Module({
  imports: [UnitOfWorkModule, RepositoriesModule],
  controllers: [QuestionsController],
  providers: [QuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
