import { PaginationResponse } from 'app/core/utils/pagination/pagination.interface';
import { Ingredient } from '../ingredients/ingredient.interface';

export interface Purchase {
    id: number;
    ingredientId: number;
    ingredient: Ingredient;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface PurchasesData extends PaginationResponse {
    data: Purchase[];
}
