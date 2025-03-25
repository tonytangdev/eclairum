import { Module } from '@nestjs/common';
import { QuizGenerationTasksController } from './quiz-generation-tasks.controller';
import { QuizGenerationTasksService } from './services/quiz-generation-tasks.service';
import { RepositoriesModule } from '../repositories/repositories.module';
import { UnitOfWorkModule } from '../unit-of-work/unit-of-work.module';
import {
  LLM_SERVICE_PROVIDER_KEY,
  OpenAILLMService,
} from './services/openai-llm.service';
import {
  FILE_UPLOAD_SERVICE_PROVIDER_KEY,
  S3FileUploadService,
} from './services/s3-file-upload.service';
import { OpenAIProvider } from './providers/openai.provider';
import {
  OCR_SERVICE_PROVIDER_KEY,
  TextractOCRService,
} from './services/textract-ocr.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [RepositoriesModule, UnitOfWorkModule, ConfigModule],
  controllers: [QuizGenerationTasksController],
  providers: [
    QuizGenerationTasksService,
    OpenAIProvider,
    {
      provide: LLM_SERVICE_PROVIDER_KEY,
      useClass: OpenAILLMService,
    },
    {
      provide: FILE_UPLOAD_SERVICE_PROVIDER_KEY,
      useClass: S3FileUploadService,
    },
    {
      provide: OCR_SERVICE_PROVIDER_KEY,
      useClass: TextractOCRService,
    },
  ],
})
export class QuizGenerationTasksModule {}
