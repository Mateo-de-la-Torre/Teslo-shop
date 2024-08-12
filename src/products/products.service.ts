import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { DataSource, Repository } from 'typeorm';
import { validate as isUUID } from "uuid";
import { Product, ProductImage } from './entities';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService');

  constructor(

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource,

  ) {}

  async create(createProductDto: CreateProductDto, user: User) {


    try {

      const { images = [], ...productDetails } = createProductDto;
      const product = this.productRepository.create({
        ...productDetails,
        images: images.map( (image) => this.productImageRepository.create({ url: image }) ),
        user,
      });

      await this.productRepository.save( product );

      return { ...product, images }; 

    } catch (error) {
      this.handleExceptions(error);
    }

  }

  async findAll(paginationDto: PaginationDto) {
    const {limit = 10, offset = 0 } = paginationDto;

    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true,
      }
    })

    return products.map( (product) => ({ 
      ...product, 
      images: product.images.map( (img) => img.url )
    }))
  }

  async findOne(term: string) {

    let product: Product;

    if (isUUID(term)) {
      product = await this.productRepository.findOneBy({id: term});
    } else {

      const queryBuilder = this.productRepository.createQueryBuilder('prod'); // queryBuilder
      product = await queryBuilder
        .where('UPPER(title) =:title or slug =:slug', {
          title: term.toUpperCase(),
          slug: term.toLowerCase()
        })
        .leftJoinAndSelect('prod.images','prodImages') // para q se puedan ver las images en el get by title, slug usando el queryBuilder
        .getOne();
    }

    if ( !product ) {
      throw new NotFoundException(`Product with term ${term} not found`)
    }

    return product;
  }

  async findOnePlain(term: string) {
    const { images = [], ...rest} = await this.findOne( term );
    return {
      ...rest,
      images: images.map( (img) => img.url )
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto, user: User) {

    const { images, ...rest} = updateProductDto;

    const product = await this.productRepository.preload({ id, ...rest, images: [] });

    if ( !product ) throw new NotFoundException(`Product with id: ${id} not found`);


    //Create Query Runner (inicia una transaccion a la BD y la ejecuta(commit))
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect(); // conecta a la BD
    await queryRunner.startTransaction(); // arranca la transaccion


    try {
      if ( images ) { // si ya tiene imagenes, las borra
        await queryRunner.manager.delete( ProductImage, { product: { id } } )
        product.images = images.map( img => this.productImageRepository.create( { url: img } )) // inserta las nuevas imagenes
      }

      product.user = user;
      await queryRunner.manager.save( product ); // graba en la BD
      await queryRunner.commitTransaction(); // ejecuta la transsaccion
      await queryRunner.release(); // termina el queryRunner

      return this.findOnePlain(id); // llama al metodo

    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      this.handleExceptions(error);      
    }
  }

  async remove(id: string) {
    const product = await this.findOne( id );
    await this.productRepository.remove( product );
    return {productDeleted: product};
  }


  private handleExceptions(error: any) {
    // console.log(error);
    if ( error.code === '23505' ) throw new BadRequestException(error.detail);

    this.logger.error(error);
    throw new InternalServerErrorException('Unexpected error, check server logs');
  }

  async deleteAllProducts() { // Elimina todos los prosductos de la BD
    const query = this.productRepository.createQueryBuilder('product');

    try {
      return await query
        .delete()
        .where({})
        .execute();

    } catch (error) {
      this.handleExceptions(error);
    }
  }
}
