import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from './products/products.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [

    //Configuracion variables de entorno
    ConfigModule.forRoot(),

    //Conexion Base de Datos
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.BD_PASSWORD,
      autoLoadEntities: true,
      synchronize: true,

    }),

    ProductsModule,

    CommonModule
    
  ],
})
export class AppModule {}
