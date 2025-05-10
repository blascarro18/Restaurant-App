import axios from "axios";
import { MarketService } from "../src/module/market.service";
import { PrismaClient } from "@prisma/client";

jest.mock("axios");
jest.mock("@prisma/client", () => {
  const mockPrisma = {
    marketHistory: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    ingredient: {
      findUnique: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

describe("MarketService", () => {
  let marketService: MarketService;
  let prismaMock: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    marketService = new MarketService();
    prismaMock = new PrismaClient() as jest.Mocked<PrismaClient>;
    jest.clearAllMocks();
  });

  describe("buyIngredientUntilAvailable", () => {
    it("should buy and record ingredient if available", async () => {
      (axios.get as jest.Mock).mockResolvedValue({ data: { quantitySold: 5 } });

      const result = await marketService.buyIngredientUntilAvailable(
        1,
        "Tomato"
      );

      expect(axios.get).toHaveBeenCalledWith(
        "https://recruitment.alegra.com/api/farmers-market/buy",
        { params: { ingredient: "tomato" } }
      );
      expect(prismaMock.marketHistory.create).toHaveBeenCalledWith({
        data: { ingredientId: 1, quantity: 5 },
      });
      expect(result).toBe(5);
    });

    it("should return 0 if no quantity sold", async () => {
      (axios.get as jest.Mock).mockResolvedValue({ data: {} });

      const result = await marketService.buyIngredientUntilAvailable(
        1,
        "Tomato"
      );

      expect(result).toBe(0);
      expect(prismaMock.marketHistory.create).not.toHaveBeenCalled();
    });

    it("should handle error and return 0", async () => {
      (axios.get as jest.Mock).mockRejectedValue(new Error("Network Error"));

      const result = await marketService.buyIngredientUntilAvailable(
        1,
        "Tomato"
      );

      expect(result).toBe(0);
    });
  });

  describe("getMarketHistory", () => {
    it("should return paginated market history with ingredient info", async () => {
      (prismaMock.marketHistory.count as jest.Mock).mockResolvedValue(2);
      (prismaMock.marketHistory.findMany as jest.Mock).mockResolvedValue([
        { id: 1, ingredientId: 10, quantity: 3 },
        { id: 2, ingredientId: 20, quantity: 5 },
      ]);
      (prismaMock.ingredient.findUnique as jest.Mock).mockImplementation(
        ({ where: { id } }) =>
          Promise.resolve({
            id,
            name: id === 10 ? "Tomato" : "Lemon",
            image: "image-url",
          })
      );

      const result = await marketService.getMarketHistory({
        limit: 10,
        page: 1,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.meta?.total).toBe(2);
    });

    it("should return error on failure", async () => {
      (prismaMock.marketHistory.findMany as jest.Mock).mockRejectedValue(
        new Error("DB error")
      );

      const result = await marketService.getMarketHistory({
        limit: 10,
        page: 1,
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
    });
  });
});
