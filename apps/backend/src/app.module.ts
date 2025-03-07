import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QuizGenerationTaskModule } from './quiz-generation-task/quiz-generation-task.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [QuizGenerationTaskModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
