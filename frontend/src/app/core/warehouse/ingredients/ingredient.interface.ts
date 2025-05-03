export interface Ingredient {
    id?: string;
    name?: string;
    image?: string;
    stock?: {
        quantity?: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface IngredientsData {
    data: Ingredient[];
}
