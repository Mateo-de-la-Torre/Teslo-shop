// Representacion de este objeto en la DB

import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ProductImage } from './index';
import { User } from "../../auth/entities/user.entity";
import { ApiProperty } from "@nestjs/swagger";

@Entity({name: 'products'})
export class Product {

    @ApiProperty({
        example: '02c3826d-d876-4e59-91ad-b3721f286ae2',
        description: 'Product ID',
        uniqueItems: true
    })
    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    @ApiProperty({
        example: 'T-shirt Teslo',
        description: 'Product Title',
        uniqueItems: true
    })
    @Column('text', {
        unique: true,
    })
    title: string;
    
    @ApiProperty({
        example: 0,
        description: 'Product Price',
    })
    @Column('float', {
        default: 0,
    })
    price: number;
    
    @ApiProperty({
        example: 'Description Example',
        description: 'Product Description',
        default: null
    })
    @Column({
        type: 'text',
        nullable: true,
    })
    description: string;
    
    @ApiProperty({
        example: 't_shirt_teslo',
        description: 'Product SLUG',
        uniqueItems: true
    })
    @Column('text', {
        unique: true,
    })
    slug: string;
    
    @ApiProperty({
        example: 10,
        description: 'Product Stock',
        default: 0
    })
    @Column('int', {
        default: 0,
    })
    stock: number;
    
    @ApiProperty({
        example: ['M','XL','XXL'],
        description: 'Product Sizes'
    })
    @Column('text', {
        array: true,
    })
    sizes: string[];
    
    @ApiProperty({
        example: 'women',
        description: 'Product Gender'
    })
    @Column('text')
    gender: string;
    
    @ApiProperty()
    @Column('text', {
        array: true,
        default: []
    })
    tags: string[];
    
    @ApiProperty()
    @OneToMany(
        () => ProductImage,
        (productImage) => productImage.product,
        { cascade: true, eager: true } // eager: para q muestre la imagenes en la busqueda por id
    )
    images?: ProductImage[];


    @ManyToOne(
        () => User,
        (user) => user.product,
        {eager: true}
    )
    user: User


    @BeforeInsert()
    checkSlugInsert() {
        if ( !this.slug) {
            this.slug = this.title;
        }

        this.slug = this.slug
            .toLowerCase()
            .replaceAll(' ', '_')
            .replaceAll("'", '')
    }

    @BeforeUpdate()
    checkSlugUpdate() {
        this.slug = this.slug
            .toLowerCase()
            .replaceAll(' ', '_')
            .replaceAll("'", '')
    }

}
