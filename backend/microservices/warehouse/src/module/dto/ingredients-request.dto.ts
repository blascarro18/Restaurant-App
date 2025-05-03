import { Type } from "class-transformer";
import { IsArray, IsInt, IsNumber, Min, ValidateNested } from "class-validator";

class Ingredient {
  @IsNumber({ maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false })
  ingredientId!: number;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class IngredientsRequestDto {
  @IsNumber({ maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false })
  orderId!: number;

  @IsNumber({ maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false })
  recipeId!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Ingredient)
  ingredients!: Ingredient[];
}
