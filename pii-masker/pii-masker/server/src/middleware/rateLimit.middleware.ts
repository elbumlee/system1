import { Request, Response, NextFunction } from "express";
import { jobStore } from "../store/jobStore";

const MAX_CONCURRENT = 3;

export function concurrencyLimit(req: Request, res: Response, next: NextFunction) {
  if (jobStore.activeCount() >= MAX_CONCURRENT) {
    return res.status(429).json({
      error: "서버가 현재 처리 중인 작업이 많습니다. 잠시 후 다시 시도해 주세요.",
    });
  }
  next();
}