import { Router, type IRouter } from "express";
import healthRouter from "./health";
import miaRouter from "./mia";
import financeRouter from "./finance";

const router: IRouter = Router();

router.use(healthRouter);
router.use(miaRouter);
router.use(financeRouter);

export default router;
