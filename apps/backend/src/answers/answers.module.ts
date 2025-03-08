import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnswerEntity } from './infrastructure/relational/entities/answer.entity';
import { AnswerRepositoryImpl } from './infrastructure/relational/repositories/answer.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AnswerEntity])],
  providers: [AnswerRepositoryImpl],
  exports: [AnswerRepositoryImpl],
})
export class AnswersModule {}
