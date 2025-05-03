import { IsNumber, IsString } from "class-validator";

export class UpdateOrderDto {
  @IsNumber({ maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false })
  id!: number;

  @IsNumber({ maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false })
  recipeId!: number;

  @IsString()
  status!: string;
}
