import { Router, type IRouter } from "express";
import healthRouter from "./health";
import miaRouter from "./mia";
import financeRouter from "./finance";
import searchRouter from "./search";

const router: IRouter = Router();

router.use(healthRouter);
router.use(miaRouter);
router.use(financeRouter);
router.use(searchRouter);

export default router;
