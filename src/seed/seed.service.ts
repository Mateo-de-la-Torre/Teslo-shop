import { Injectable } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { initialData } from './data/seed-data';



@Injectable()
export class SeedService {
  
  constructor(
    private readonly productsService: ProductsService
  ) {}

  async executedSeed() {

    await this.inserNewProduct();
    return 'Seed Executed';
  }

  private async inserNewProduct() {
    await this.productsService.deleteAllProducts();

    const products = initialData.products;

    const insertPromises = [];

    products.forEach( product => {
      insertPromises.push( this.productsService.create( product ) );
    });

    await Promise.all( insertPromises );

    return true;
  }
}
