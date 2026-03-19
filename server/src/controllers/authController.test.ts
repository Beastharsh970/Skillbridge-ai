import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import express from "express";
import { register } from "./authController";
import { errorHandler } from "../middleware/errorHandler";
import { User } from "../models/User";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

vi.mock("../models/User");
vi.mock("jsonwebtoken");
vi.mock("bcryptjs");
vi.mock("../config/env", () => ({
  env: { JWT_SECRET: "testsecret" },
}));

const app = express();
app.use(express.json());
app.post("/api/auth/register", register);
app.use(errorHandler);

describe("Auth Controller - Register", () => {
  it("Happy Path: should successfully register a new user and return a token", async () => {
    // Setup Mock responses
    vi.mocked(User.findOne).mockResolvedValue(null);
    vi.mocked(bcrypt.hash).mockResolvedValue("hashedpassword123" as any);
    
    const mockUser = {
      _id: "fake_id_123",
      name: "Test User",
      email: "test@example.com",
      experienceLevel: "beginner",
      skills: [],
    };
    vi.mocked(User.create).mockResolvedValue(mockUser as any);
    vi.mocked(jwt.sign).mockReturnValue("test_token_string" as any);

    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test User",
        email: "test@example.com",
        password: "securepassword",
        experienceLevel: "beginner",
      });

    expect(res.status).toBe(201);
    expect(res.body.token).toBe("test_token_string");
    expect(res.body.user.name).toBe("Test User");
    expect(res.body.user.email).toBe("test@example.com");
  });

  it("Edge Case: should return 400 and validation errors if input is invalid", async () => {
    // Send request missing required fields (name, and short password)
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: "invalidemail.com",
        password: "short", 
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
    
    // Check specific Zod validation details
    const fields = res.body.details.map((d: any) => d.field);
    expect(fields).toContain("name");
    expect(fields).toContain("email");
    expect(fields).toContain("password");
  });
});
