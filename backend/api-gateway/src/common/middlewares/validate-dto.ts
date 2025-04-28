import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { IncomingMessage } from "http";

export async function validateDto<T extends object>(
  req: IncomingMessage,
  dtoClass: new () => T
): Promise<{ data: T | null; errors: string[] }> {
  const body = await new Promise<string>((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", (err) => reject(err));
  });

  const parsedBody = JSON.parse(body);
  const instance = plainToInstance(dtoClass, parsedBody);
  const errors = await validate(instance);

  if (errors.length > 0) {
    return {
      data: null,
      errors: errors.map((e) => Object.values(e.constraints || {}).join(", ")),
    };
  }

  return { data: instance, errors: [] };
}
