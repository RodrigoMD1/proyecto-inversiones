import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { LoggingInterceptor } from './interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap')

  // Interceptor para loguear body RAW
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true, // Permite transformar strings a numbers automáticamente
      exceptionFactory: (errors) => {
        console.log('❌ Errores de validación:', JSON.stringify(errors, null, 2));
        return errors;
      }
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



