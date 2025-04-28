import { IsNumber, IsString } from "class-validator";

export class UpdateOrderDto {
  @IsNumber()
  @IsNumber({ maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false })
  id!: number;

  @IsNumber()
  @IsNumber({ maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false })
  recipeId!: number;

  @IsString()
  status!: string;
}
