import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap')


  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  // Habilitar CORS para múltiples orígenes
  // app.enableCors({
  //  origin: ['http://localhost:5173', 'https://fahaadtienda01.netlify.app'], // URLs permitidas
  //  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  //  credentials: true,
  // });


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



