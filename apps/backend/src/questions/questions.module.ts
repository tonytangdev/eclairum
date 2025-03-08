import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionEntity } from './infrastructure/relational/entities/question.entity';
import { QuestionRepositoryImpl } from './infrastructure/relational/repositories/question.repository';

@Module({
  imports: [TypeOrmModule.forFeature([QuestionEntity])],
  providers: [
    {
      provide: 'QuestionRepository',
      useClass: QuestionRepositoryImpl,
    },
  ],
  exports: ['QuestionRepository'],
})
export class QuestionsModule {}
