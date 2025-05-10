import { AuthService } from "../src/module/auth.service";
import * as jwt from "jsonwebtoken";

// Mock de prisma
jest.mock("@prisma/client", () => {
  const user = {
    id: "1",
    username: "admin",
    password: "Abc12345$",
  };

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: {
        findUnique: jest.fn(({ where: { username, id } }) => {
          if (username === "admin" || id === "1") return user;
          return null;
        }),
      },
    })),
  };
});

// Mocks de bcrypt y jwt
jest.mock("bcryptjs", () => ({
  compareSync: jest.fn((password, hashed) => password === "Abc12345$"),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(() => "mocked.token"),
  verify: jest.fn(() => ({ id: "1" })),
}));

describe("AuthService", () => {
  const authService = new AuthService();

  describe("signJWT", () => {
    it("should return a signed JWT", async () => {
      process.env.JWT_SECRET = "testsecret";
      const token = await authService.signJWT({ id: "1" });
      expect(token).toBe("mocked.token");
    });
  });

  describe("login", () => {
    it("should return token if credentials are valid", async () => {
      const response = await authService.login({
        username: "admin",
        password: "Abc12345$",
      });

      expect(response.success).toBe(true);
      expect(response.data?.token).toBe("mocked.token");
    });

    it("should return 404 if user not found", async () => {
      const response = await authService.login({
        username: "wronguser",
        password: "whatever",
      });

      expect(response.success).toBe(false);
      expect(response.status).toBe(404);
    });

    it("should return 404 if password is incorrect", async () => {
      const response = await authService.login({
        username: "testuser",
        password: "wrongpassword",
      });

      expect(response.success).toBe(false);
      expect(response.status).toBe(404);
    });
  });

  describe("verifyToken", () => {
    it("should return token if token is valid and user exists", async () => {
      process.env.JWT_SECRET = "testsecret";
      const response = await authService.verifyToken("mock.token");
      expect(response.success).toBe(true);
      expect(response.data?.token).toBe("mocked.token");
    });

    it("should return 404 if user is not found", async () => {
      (jwt.verify as jest.Mock).mockReturnValueOnce({ id: "unknown" });
      const response = await authService.verifyToken("mock.token");
      expect(response.success).toBe(false);
      expect(response.status).toBe(404);
    });

    it("should return 400 if token is invalid", async () => {
      (jwt.verify as jest.Mock).mockImplementationOnce(() => {
        throw new Error("invalid token"); // Lanza el error correctamente
      });
      const response = await authService.verifyToken("bad.token");
      expect(response.success).toBe(false);
      expect(response.status).toBe(400);
    });
  });
});
