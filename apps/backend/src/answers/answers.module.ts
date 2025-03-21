import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnswerEntity } from './infrastructure/relational/entities/answer.entity';
import { AnswerRepositoryImpl } from './infrastructure/relational/repositories/answer.repository';
import { UnitOfWorkModule } from '../unit-of-work/unit-of-work.module';

@Module({
  imports: [TypeOrmModule.forFeature([AnswerEntity]), UnitOfWorkModule],
  providers: [AnswerRepositoryImpl],
  exports: [AnswerRepositoryImpl],
})
export class AnswersModule {}
