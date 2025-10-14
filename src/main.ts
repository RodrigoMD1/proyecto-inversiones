import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    })
  );

   //Habilitar CORS para múltiples orígenes
   app.enableCors({
    origin: [
      'http://localhost:5173', 
      'http://localhost:5174',
      'http://localhost:3000',
      'https://financepr.netlify.app'
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Disposition', 'Content-Type', 'Content-Length'],
    preflightContinue: false,
    optionsSuccessStatus: 204
   });


  const config = new DocumentBuilder()
    .setTitle('Proyecto AFIP API')
    .setDescription('Documentación de la API de autenticación')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT);
  logger.log(`app corriendo en el puerto ${process.env.PORT}`);
}
bootstrap();



