const messageService = require('../../services/messageService');
const catchAsync = require('../../utils/catchAsync');

exports.send = catchAsync(async (req, res, next) => {
    const message = await messageService.sendMessage(req.user.id, req.body);

    res.status(201).json({
        success: true,
        status: 'success',
        data: message
    });
});

exports.getChat = catchAsync(async (req, res, next) => {
    const messages = await messageService.getChatMessages(req.user.id, req.params.userId);

    res.status(200).json({
        success: true,
        status: 'success',
        results: messages.length,
        data: messages
    });
});

exports.getGroupChat = catchAsync(async (req, res, next) => {
    const messages = await messageService.getGroupMessages(req.params.groupId);

    res.status(200).json({
        success: true,
        status: 'success',
        results: messages.length,
        data: messages
    });
});

exports.toggleReaction = catchAsync(async (req, res, next) => {
    const message = await messageService.toggleReaction(
        req.params.messageId,
        req.user.id,
        req.body.emoji
    );

    res.status(200).json({
        success: true,
        status: 'success',
        data: { messageId: message._id, reactions: message.reactions }
    });
});

exports.markDelivered = catchAsync(async (req, res, next) => {
    const message = await messageService.markMessageAsDelivered(
        req.params.messageId,
        req.user.id
    );

    res.status(200).json({
        success: true,
        status: 'success',
        data: { messageId: message._id, deliveredTo: message.deliveredTo }
    });
});

exports.markRead = catchAsync(async (req, res, next) => {
    const message = await messageService.markMessageAsRead(
        req.params.messageId,
        req.user.id
    );

    res.status(200).json({
        success: true,
        status: 'success',
        data: { messageId: message._id, readBy: message.readBy }
    });
});
