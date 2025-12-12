import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])], // Yeh line add karein
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Taaki AuthModule isse baad mein use kar sake
})
export class UsersModule {}
