import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QuizGenerationTasksModule } from './quiz-generation-tasks/quiz-generation-tasks.module';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionsModule } from './questions/questions.module';
import { AnswersModule } from './answers/answers.module';
import { UserAnswersModule } from './user-answers/user-answers.module';
import { APP_GUARD } from '@nestjs/core';
import { ApiKeyGuard } from './common/guards/api-key.guard';
import { UnitOfWorkModule } from './unit-of-work/unit-of-work.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        console.log('DATABASE_HOST', configService.get('DATABASE_HOST'));
        return {
          type: 'postgres',
          host: configService.getOrThrow('DATABASE_HOST'),
          port: configService.getOrThrow('DATABASE_PORT'),
          username: configService.getOrThrow('DATABASE_USERNAME'),
          password: configService.getOrThrow('DATABASE_PASSWORD'),
          database: configService.getOrThrow('DATABASE_NAME'),
          synchronize: configService.getOrThrow('DATABASE_SYNCHRONIZE'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          ssl:
            configService.get('DATABASE_SSL') === 'true'
              ? { rejectUnauthorized: false }
              : false,
          logging: configService.get('TYPEORM_LOGGING') === 'true',
        };
      },
    }),
    QuizGenerationTasksModule,
    UsersModule,
    QuestionsModule,
    AnswersModule,
    UserAnswersModule,
    UnitOfWorkModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
  ],
})
export class AppModule {}
