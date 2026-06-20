import { Router } from 'express';
import * as ctrl from '../controllers/gameController';
import { telegramAuthMiddleware } from '../middleware/telegramAuth';
import { requireUserAccess } from '../middleware/userAccess';

const router = Router();

router.get('/config', ctrl.config);
router.get('/leaderboard', ctrl.leaderboard);

router.use(telegramAuthMiddleware);
router.post('/auth', ctrl.auth);

router.use('/state/:userId', requireUserAccess);
router.get('/state/:userId', ctrl.getState);

router.use('/offline/:userId', requireUserAccess);
router.post('/offline/:userId/collect', ctrl.collectOfflineHandler);

router.use('/build/:userId', requireUserAccess);
router.post('/build/:userId', ctrl.build);

router.use('/research/:userId', requireUserAccess);
router.post('/research/:userId', ctrl.research);

router.use('/era/:userId', requireUserAccess);
router.post('/era/:userId/advance', ctrl.eraAdvance);

router.use('/wonder/:userId', requireUserAccess);
router.post('/wonder/:userId/start', ctrl.wonderStart);

router.use('/territory/:userId', requireUserAccess);
router.post('/territory/:userId/unlock', ctrl.territoryUnlock);

router.use('/shop/:userId', requireUserAccess);
router.post('/shop/:userId/invoice', ctrl.shopCreateInvoice);
router.post('/shop/:userId/send-invoice', ctrl.shopSendInvoice);
router.post('/shop/:userId/purchase', ctrl.shopPurchase);

router.use('/wheel/:userId', requireUserAccess);
router.post('/wheel/:userId/spin', ctrl.wheelSpin);

router.use('/gather/:userId', requireUserAccess);
router.post('/gather/:userId/click', ctrl.gatherClick);
router.post('/gather/:userId/auto', ctrl.autoGatherToggle);
router.post('/gather/:userId/auto-summary/dismiss', ctrl.dismissAutoGatherSummaryHandler);

router.use('/daily-bonus/:userId', requireUserAccess);
router.post('/daily-bonus/:userId/claim', ctrl.claimDailyBonusHandler);

router.use('/referrals/:userId', requireUserAccess);
router.get('/referrals/:userId', ctrl.referrals);

router.use('/civilization/:userId', requireUserAccess);
router.patch('/civilization/:userId', ctrl.renameCiv);

export default router;
