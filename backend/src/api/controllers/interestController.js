const Interest = require('../../models/Interest');
const AppError = require('../../utils/appError');
const User = require('../../models/User');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const normalizeLabel = (value) =>
    value.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .replace(/\s+/g, ' ');

/**
 * Get all interests (grouped by category)
 * @route GET /api/interests
 */
exports.getAllInterests = async (req, res, next) => {
    try {
        const interests = await Interest.find().sort({ category: 1 });

        const formatted = interests.map(int => ({
            id: int._id,
            category: int.category,
            subcategories: int.subcategories
                .filter(sub => sub.isApproved)
                .map(sub => normalizeLabel(sub.name))
                .sort((a, b) => a.localeCompare(b))
        })).filter(item => item.subcategories.length > 0);

        res.status(200).json({
            success: true,
            count: formatted.length,
            data: formatted
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Add custom subcategory (Premium Users Only)
 * @route POST /api/interests
 */
exports.addCustomInterest = async (req, res, next) => {
    try {
        const { category, subcategory } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user || !user.isPremium) {
            throw new AppError('Only Premium users can create custom interest tags', 403);
        }

        if (
            typeof category !== 'string' ||
            typeof subcategory !== 'string' ||
            !category.trim() ||
            !subcategory.trim()
        ) {
            throw new AppError('Category and subcategory name are required', 400);
        }

        const cleanCategory = normalizeLabel(category);
        const cleanSubcategory = normalizeLabel(subcategory);

        if (cleanCategory.length < 2 || cleanCategory.length > 40) {
            throw new AppError('Category name must be between 2 and 40 characters', 400);
        }

        if (cleanSubcategory.length < 2 || cleanSubcategory.length > 40) {
            throw new AppError('Subcategory name must be between 2 and 40 characters', 400);
        }

        let interestDoc = await Interest.findOne({
            category: new RegExp(`^${escapeRegex(cleanCategory)}$`, 'i')
        });

        if (!interestDoc) {
            interestDoc = new Interest({
                category: cleanCategory,
                subcategories: [{
                    name: cleanSubcategory,
                    createdBy: userId,
                    isApproved: true
                }]
            });
            await interestDoc.save();
        } else {
            const exists = interestDoc.subcategories.some(
                sub => normalizeLabel(sub.name).toLowerCase() === cleanSubcategory.toLowerCase()
            );

            if (exists) {
                throw new AppError('This subcategory already exists under this category', 400);
            }

            interestDoc.subcategories.push({
                name: cleanSubcategory,
                createdBy: userId,
                isApproved: true
            });
            await interestDoc.save();
        }

        res.status(201).json({
            success: true,
            data: {
                category: interestDoc.category,
                subcategory: cleanSubcategory
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return next(new AppError('Interest tag already exists', 400));
        }
        next(error);
    }
};
