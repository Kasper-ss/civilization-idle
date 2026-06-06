import { Router } from 'express';
import * as ctrl from '../controllers/gameController';
import { telegramAuthMiddleware } from '../middleware/telegramAuth';

const router = Router();

router.get('/config', ctrl.config);
router.get('/leaderboard', ctrl.leaderboard);

router.use(telegramAuthMiddleware);
router.post('/auth', ctrl.auth);
router.get('/state/:userId', ctrl.getState);
router.post('/offline/:userId/collect', ctrl.collectOfflineHandler);
router.post('/build/:userId', ctrl.build);
router.post('/research/:userId', ctrl.research);
router.post('/era/:userId/advance', ctrl.eraAdvance);
router.post('/wonder/:userId/start', ctrl.wonderStart);
router.post('/territory/:userId/unlock', ctrl.territoryUnlock);
router.post('/shop/:userId/invoice', ctrl.shopCreateInvoice);
router.post('/shop/:userId/send-invoice', ctrl.shopSendInvoice);
router.post('/shop/:userId/purchase', ctrl.shopPurchase);
router.post('/wheel/:userId/spin', ctrl.wheelSpin);
router.post('/gather/:userId/click', ctrl.gatherClick);
router.post('/gather/:userId/auto', ctrl.autoGatherToggle);
router.get('/referrals/:userId', ctrl.referrals);
router.patch('/civilization/:userId', ctrl.renameCiv);

export default router;
