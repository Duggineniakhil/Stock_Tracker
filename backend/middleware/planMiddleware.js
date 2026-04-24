const PLAN_LIMITS = {
    free: {
        maxHoldings: 5,
        maxAlerts: 3,
        aiChats: 0,
        realtimeRefresh: 30, // seconds
        historyDays: 30,
        reports: false,
        exportCsv: false
    },
    student: {
        maxHoldings: 20,
        maxAlerts: 10,
        aiChats: 50, // messages/month
        realtimeRefresh: 15,
        historyDays: 180,
        reports: true,
        exportCsv: true
    },
    pro: {
        maxHoldings: Infinity,
        maxAlerts: Infinity,
        aiChats: Infinity,
        realtimeRefresh: 5,
        historyDays: 1825, // 5 years
        reports: true,
        exportCsv: true
    }
};

/**
 * Middleware to restrict access based on user plan
 * @param  {...string} plans - Allowed plans
 */
function requirePlan(...plans) {
    return (req, res, next) => {
        // Default to 'free' if no plan is set
        const userPlan = req.user && req.user.plan ? req.user.plan : 'free';

        if (!plans.includes(userPlan)) {
            return res.status(403).json({
                success: false,
                error: 'PLAN_UPGRADE_REQUIRED',
                message: `This feature requires a ${plans.join(' or ')} plan. You are currently on the ${userPlan} plan.`,
                currentPlan: userPlan,
                requiredPlans: plans
            });
        }
        next();
    };
}

module.exports = {
    PLAN_LIMITS,
    requirePlan
};
