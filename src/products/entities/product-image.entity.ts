import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "./index";


@Entity({name: 'product_images'})
export class ProductImage {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('text')
    url: string;

    @ManyToOne(
        () => Product,
        (product) => product.images,
        { onDelete: "CASCADE" } // si se limina un elemento de la tabla, se elimina el elemnto relacionado de la otra tabla
    )
    product: Product
}