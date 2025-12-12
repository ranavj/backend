import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { ApolloDriverConfig, ApolloDriver } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
  imports: [
    // 1. Config Module (env file padhne ke liye)
    ConfigModule.forRoot({
      isGlobal: true, // Poori app mein accessible hoga
    }),

    // 2. PostgreSQL Connection (Relational DB)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('POSTGRES_HOST'),
        port: configService.get<number>('POSTGRES_PORT'),
        username: configService.get<string>('POSTGRES_USER'),
        password: configService.get<string>('POSTGRES_PASSWORD'),
        database: configService.get<string>('POSTGRES_DB'),
        autoLoadEntities: true, // Models automatic load honge
        synchronize: true, // Dev mode mein tables automatic banenge (Prod mein false rakhna)
      }),
    }),

    // 3. MongoDB Connection (NoSQL DB)
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
    }),

    // Yeh naya block add karein 👇
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'), // Schema auto-generate hogi
      sortSchema: true,
      playground: true, // Browser mein Query test karne ke liye interface milega
    }),

    // 👇 CACHE MODULE ADD KAREIN
    CacheModule.registerAsync({
      isGlobal: true, // Poori app mein accessible hoga
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: 'localhost', // Docker Redis Host
            port: 6379,
          },
          ttl: 60 * 1000, // Default: Data 60 seconds tak zinda rahega
        }),
      }),
    }),
    UsersModule,

    AuthModule,

    PostsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}