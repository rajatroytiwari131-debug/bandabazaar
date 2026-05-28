import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import storesRouter from "./stores";
import productsRouter from "./products";
import ordersRouter from "./orders";
import adminRouter from "./admin";
import couponsRouter from "./coupons";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(storesRouter);
router.use(productsRouter);
router.use(ordersRouter);
router.use(adminRouter);
router.use(couponsRouter);

export default router;
