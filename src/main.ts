import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Yeh line add karein validation enable karne ke liye
  app.useGlobalPipes(new ValidationPipe());
  // 👇 Yeh line add karein (Security Gate kholne ke liye)
  app.enableCors({
    origin: 'http://localhost:4200', // Sirf Angular ko allow karein
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
