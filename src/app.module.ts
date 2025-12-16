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
import { User } from './users/entities/user.entity';
import { makeCounterProvider, PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { SearchModule } from './search/search.module';
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
       // 👇 REPLICATION SETUP STARTS HERE
        replication: {
          // 1. MASTER (Write) - Likhne ke liye
          master: {
            host: configService.get<string>('POSTGRES_HOST'),
            port: configService.get<number>('POSTGRES_PORT'),
            username: configService.get<string>('POSTGRES_USER'),
            password: configService.get<string>('POSTGRES_PASSWORD'),
            database: configService.get<string>('POSTGRES_DB'),
          },
          // 2. SLAVES (Read) - Padhne ke liye (List of mirrors)
          slaves: [
            {
              // Real world mein yahan 'postgres-slave-1' ka IP aata
              // Abhi hum same container use kar rahe hain simulation ke liye
              host: configService.get<string>('POSTGRES_HOST'), 
              port: configService.get<number>('POSTGRES_PORT'),
              username: configService.get<string>('POSTGRES_USER'),
              password: configService.get<string>('POSTGRES_PASSWORD'),
              database: configService.get<string>('POSTGRES_DB'),
            },
            // Future mein hum aur slaves add kar sakte hain
          ],
        },
        
        entities: [User], // Apni entities yahan define karein (autoLoadEntities hata diya)
        autoLoadEntities: true, // Ya isse true rakhein
        synchronize: true, // Prod mein false hona chahiye
        logging: false, // 👈 Isse console mein SQL queries dikhengi
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

   // 👇 CACHE MODULE UPDATE KAREIN
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule], // ConfigModule import karein
      inject: [ConfigService], // ConfigService inject karein
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          socket: {
            // 👇 'localhost' hata kar yeh likhein:
            host: configService.get<string>('REDIS_HOST') || 'localhost',
            port: configService.get<number>('REDIS_PORT') || 6379,
          },
          ttl: 60 * 1000,
        }),
      }),
    }),
    // 👇 1. BullMQ Config (Redis Connection)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST') || 'redis', // Docker service name
          port: 6379,
          password: 'adminpassword'
        },
      }),
      inject: [ConfigService],
    }),

    // Yeh automatic '/metrics' route bana dega
    PrometheusModule.register({
      defaultMetrics:{
        enabled: true
      }
    }),
    // 👇 BULL BOARD SETUP
    BullBoardModule.forRoot({
      route: '/queues', // Dashboard is URL par dikhega
      adapter: ExpressAdapter,
    }),
    UsersModule,

    AuthModule,

    PostsModule,

    SearchModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // HTTP Request Counter Banayein
    makeCounterProvider({
      name: 'http_requests_total', // Graph is naam ko dhoond raha hai
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status'], // Filters
    }),
    // INTERCEPTOR REGISTER KAREIN
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
})
export class AppModule {}