const notificationService = require('../../services/notificationService');
const catchAsync = require('../../utils/catchAsync');

exports.getMyNotifications = catchAsync(async (req, res, next) => {
    const { page, limit } = req.query;
    const result = await notificationService.getNotificationsForUser(req.user.id, page, limit);

    res.status(200).json({
        success: true,
        status: 'success',
        results: result.notifications.length,
        total: result.total,
        page: result.page,
        pages: result.pages,
        data: result.notifications
    });
});

exports.markRead = catchAsync(async (req, res, next) => {
    await notificationService.markAsRead(req.user.id, req.params.id);

    res.status(200).json({
        success: true,
        status: 'success',
        message: 'Notification(s) marked as read'
    });
});

exports.deleteNotification = catchAsync(async (req, res, next) => {
    await notificationService.deleteNotification(req.user.id, req.params.id);

    res.status(204).json({
        success: true,
        status: 'success',
        data: null
    });
});

exports.clearAll = catchAsync(async (req, res, next) => {
    await notificationService.clearAllNotifications(req.user.id);

    res.status(204).json({
        success: true,
        status: 'success',
        data: null
    });
});

exports.getUnreadCount = catchAsync(async (req, res, next) => {
    const count = await notificationService.getUnreadCount(req.user.id);

    res.status(200).json({
        success: true,
        status: 'success',
        data: { count }
    });
});
