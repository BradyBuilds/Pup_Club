import { Router, type IRouter } from "express";
import healthRouter from "./health";
import venueRouter from "./venue";
import patronsRouter from "./patrons";
import gamesRouter from "./games";
import scoresRouter from "./scores";
import menuRouter from "./menu";
import eventsRouter from "./events";

const router: IRouter = Router();

router.use(healthRouter);
router.use(venueRouter);
router.use(patronsRouter);
router.use(gamesRouter);
router.use(scoresRouter);
router.use(menuRouter);
router.use(eventsRouter);

export default router;
