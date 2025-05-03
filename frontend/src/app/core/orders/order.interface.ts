import { Recipe } from '../kitchen/recipes/recipe.interface';
import { PaginationResponse } from '../utils/pagination/pagination.interface';

export interface Order {
    id: string;
    recipeId: number;
    recipe: Recipe;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface OrdersData extends PaginationResponse {
    data: Order[];
}

export interface OrderData {
    data: Order;
}
