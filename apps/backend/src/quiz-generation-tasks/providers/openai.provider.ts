import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export const OPENAI_CLIENT = 'OPENAI_CLIENT';

export const OpenAIProvider: Provider = {
  provide: OPENAI_CLIENT,
  useFactory: (configService: ConfigService) => {
    return new OpenAI({
      apiKey: configService.getOrThrow<string>('OPENAI_API_KEY'),
    });
  },
  inject: [ConfigService],
};
