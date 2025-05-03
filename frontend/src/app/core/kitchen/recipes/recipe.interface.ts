export interface Recipe {
    id?: string;
    name?: string;
    description?: string;
    image?: string;
    ingredients?: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface RecipesData {
    data: Recipe[];
}
