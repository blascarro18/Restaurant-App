import { PrismaClient } from "@prisma/client";
import * as bcryptjs from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { JwtPayload } from "jsonwebtoken";

import * as dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

export class AuthService {
  // Función para generar JWT
  async signJWT(payload: JwtPayload) {
    const secretKey: string =
      process.env.JWT_SECRET ||
      (() => {
        throw new Error("JWT_SECRET is not defined in environment variables");
      })();

    const expiresIn = "1h";

    return jwt.sign(payload, secretKey, { expiresIn });
  }

  //Login
  async login(loginUserDto: { username: string; password: string }) {
    const { username, password } = loginUserDto;

    try {
      const user = await prisma.user.findUnique({
        where: {
          username,
        },
      });

      if (!user) {
        return {
          success: false,
          status: 404,
          message: "El usuario o la contraseña son incorrectas.",
        };
      }

      const isPasswordValid = bcryptjs.compareSync(password, user.password);

      if (!isPasswordValid) {
        return {
          success: false,
          status: 404,
          message: "El usuario o la contraseña son incorrectas.",
        };
      }

      const { password: __, ...userData } = user; // Excluimos la contraseña del resultado

      return {
        success: true,
        status: 200,
        data: {
          token: await this.signJWT(userData),
        },
      };
    } catch (error) {
      console.error("Error durante el login:", error);
      return {
        success: false,
        status: 400,
        message: "Ocurrió un error durante el proceso de autenticación.",
      };
    }
  }

  // Función para verificar el token JWT
  async verifyToken(token: string) {
    try {
      const secretKey: string =
        process.env.JWT_SECRET ||
        (() => {
          throw new Error("JWT_SECRET is not defined in environment variables");
        })();

      const decoded = jwt.verify(token, secretKey) as JwtPayload;

      if (!decoded) {
        return {
          success: false,
          status: 401,
          message: "Token inválido.",
        };
      }

      const user = await prisma.user.findUnique({
        where: {
          id: decoded.id,
        },
      });

      if (!user) {
        return {
          success: false,
          status: 404,
          message: "Usuario no encontrado.",
        };
      }

      return {
        success: true,
        status: 200,
        data: {
          token: await this.signJWT(user),
        },
      };
    } catch (error) {
      console.error("Error durante la validación del token:", error);
      return {
        success: false,
        status: 400,
        message: "Ocurrió un error durante el proceso de autenticación.",
      };
    }
  }
}
