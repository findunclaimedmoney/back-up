import { Router, type IRouter } from "express";
import healthRouter from "./health";
import miaRouter from "./mia";

const router: IRouter = Router();

router.use(healthRouter);
router.use(miaRouter);

export default router;
