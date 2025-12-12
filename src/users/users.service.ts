import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt'; // Password hashing ke liye

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    // 1. Check karein ki user pehle se toh nahi hai
    const existingUser = await this.usersRepository.findOne({
      where: [{ email: createUserDto.email }, { username: createUserDto.username }],
    });

    if (existingUser) {
      throw new BadRequestException('User with this email or username already exists');
    }

    // 2. Password Hash karein
    const salt = await bcrypt.genSalt(); // Namak chhidakna (Security badhana)
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    // 3. Naya User create karein
    const newUser = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword, // Hashed password save karein
    });

    // 4. Database mein save karein
    return this.usersRepository.save(newUser);
  }

  // Email se user dhundhne ke liye helper
  async findByEmail(email: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { email } }) as any;
  }
  // Baaki functions ko abhi ke liye aise hi chhod dein
  findAll() { return `This action returns all users`; }
  // ID se user dhundhne ke liye (Postgres se)
  async findOne(id: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { id } }) as any;
  }
  update(id: number, updateUserDto: any) { return `This action updates a #${id} user`; }
  remove(id: number) { return `This action removes a #${id} user`; }
}