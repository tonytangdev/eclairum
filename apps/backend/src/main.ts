import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DomainExceptionsFilter } from './exceptions/domain-exceptions.filter';
import * as dns from 'node:dns';

// Force Node.js to prefer IPv4 addresses during DNS resolution
dns.setDefaultResultOrder('ipv4first');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new DomainExceptionsFilter());

  console.log(`Listening on port ${process.env.PORT ?? 3000}`);
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(`Application running on ${await app.getUrl()}`);
}
void bootstrap();
