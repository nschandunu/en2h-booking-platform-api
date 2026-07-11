import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from '@config/app.config';
import databaseConfig from '@config/database.config';
import jwtConfig from '@config/jwt.config';
import { envValidationSchema } from '@config/validation.schema';
import { PrismaModule } from '@database/prisma.module';
import { HealthModule } from '@modules/health/health.module';
import { UsersModule } from '@modules/users/users.module';
import { AuthModule } from '@modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    PrismaModule,
    HealthModule,
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}
