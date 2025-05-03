import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

export async function validateDto<T extends object>(
  body: any, // Ahora recibe el body ya parseado
  dtoClass: new () => T
): Promise<{ data: T | null; errors: string[] }> {
  const instance = plainToInstance(dtoClass, body); // Ya tienes el objeto directamente
  const errors = await validate(instance);

  if (errors.length > 0) {
    return {
      data: null,
      errors: errors.map((e) => Object.values(e.constraints || {}).join(", ")),
    };
  }

  return { data: instance, errors: [] };
}
