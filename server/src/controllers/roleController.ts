import { Request, Response, NextFunction } from "express";
import { Role } from "../models/Role";

export async function getRoles(_req: Request, res: Response, next: NextFunction) {
  try {
    const roles = await Role.find().sort({ title: 1 });
    res.json({ roles });
  } catch (err) {
    next(err);
  }
}

export async function getRoleById(req: Request, res: Response, next: NextFunction) {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      res.status(404).json({ error: "Role not found" });
      return;
    }
    res.json({ role });
  } catch (err) {
    next(err);
  }
}
