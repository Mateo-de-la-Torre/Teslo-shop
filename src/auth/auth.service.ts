import { BadRequestException, Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import * as bcrypt from "bcrypt";

import { CreateUserDto, LoginUserDto } from './dto';
import { User } from './entities/user.entity';
import { JwtPayload } from './interfaces/jwt-payload.interfaces';

@Injectable()
export class AuthService {
  
  private readonly logger = new Logger('UsersService')
  
  constructor(

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,


    private readonly jwtService: JwtService,


  ) {}
  
  async create(createUserDto: CreateUserDto) {

    try {
      const { password, ...userData } = createUserDto;

      const user = this.userRepository.create({ 
        ...userData,
        password: bcrypt.hashSync( password, 10 )
      });
      
      await this.userRepository.save( user );

      delete user.password;
      return {
        ...user,
        token: this.getJwtToken({ id: user.id })
      }; 

    } catch (error) {
      this.handleExceptions(error);
      
    }
  }

  async login(loginUserDto: LoginUserDto) {

    const { password, email } = loginUserDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: { email: true, password: true, id: true } 
    });

    if (!user) throw new UnauthorizedException('Credentials ane not valid (email)');

    if ( !bcrypt.compareSync( password, user.password )) throw new UnauthorizedException('Credentials ane not valid (password)');

    return {
      ...user,
      token: this.getJwtToken({ id: user.id })
    };      
  }

  async checkAuthStatus(user: User) {
    return {
      ...user,
      token: this.getJwtToken({ id: user.id })
    }; 
  }


// GENERA EL TOKEN
  private getJwtToken( payload: JwtPayload ) {

    const token = this.jwtService.sign( payload );
    return token;
  }


  private handleExceptions(error: any): never {
    // console.log(error);
    if ( error.code === '23505' ) throw new BadRequestException(error.detail);

    this.logger.error(error);
    throw new InternalServerErrorException('Unexpected error, check server logs');
  }
}
