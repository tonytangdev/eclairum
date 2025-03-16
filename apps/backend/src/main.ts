import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DomainExceptionsFilter } from './exceptions/domain-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new DomainExceptionsFilter());

  console.log(`Listening on port ${process.env.PORT ?? 3001}`);
  await app.listen(`0.0.0.0:${process.env.PORT ?? 3001}`);
}
void bootstrap();
