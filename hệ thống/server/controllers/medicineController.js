const Medicine = require('../models/Medicine');

// Escape ký tự đặc biệt trước khi đưa vào RegExp để tránh sai biểu thức chính quy
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.getMedicines = async (req, res, next) => {
  try {
    const { search, unit, lowStock, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (search && search.trim()) {
      const keyword = escapeRegex(search.trim());
      filter.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { activeIngredient: { $regex: keyword, $options: 'i' } }
      ];
    }

    if (unit && unit.trim()) {
      filter.unit = unit.trim();
    }

    if (lowStock === 'true') {
      filter.$expr = { $lte: ['$stockQuantity', '$minStockAlert'] };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [medicines, total, summaryAgg] = await Promise.all([
      Medicine.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Medicine.countDocuments(filter),
      Medicine.aggregate([
        {
          $group: {
            _id: null,
            totalMedicines: { $sum: 1 },
            lowStockCount: {
              $sum: {
                $cond: [{ $lte: ['$stockQuantity', '$minStockAlert'] }, 1, 0]
              }
            },
            totalUnits: { $sum: '$stockQuantity' }
          }
        }
      ])
    ]);

    const summary = summaryAgg[0]
      ? {
          totalMedicines: summaryAgg[0].totalMedicines,
          lowStockCount: summaryAgg[0].lowStockCount,
          totalUnits: summaryAgg[0].totalUnits
        }
      : { totalMedicines: 0, lowStockCount: 0, totalUnits: 0 };

    res.status(200).json({
      success: true,
      count: medicines.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      summary,
      data: medicines
    });
  } catch (error) {
    next(error);
  }
};

exports.getMedicineById = async (req, res, next) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thuốc trong kho!'
      });
    }

    res.status(200).json({
      success: true,
      data: medicine
    });
  } catch (error) {
    next(error);
  }
};

exports.createMedicine = async (req, res, next) => {
  try {
    const {
      name,
      activeIngredient,
      unit,
      price,
      stockQuantity,
      minStockAlert,
      usageInstructions
    } = req.body;

    if (!name || !name.trim() || price === undefined || stockQuantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ tên thuốc, đơn giá và số lượng tồn kho!'
      });
    }

    if (Number(price) < 0 || Number(stockQuantity) < 0 || (minStockAlert !== undefined && Number(minStockAlert) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Đơn giá, số lượng tồn kho và ngưỡng cảnh báo không được là số âm!'
      });
    }

    const escapedName = escapeRegex(name.trim());
    const existingMedicine = await Medicine.findOne({
      name: { $regex: `^${escapedName}$`, $options: 'i' }
    });

    if (existingMedicine) {
      return res.status(409).json({
        success: false,
        message: `Thuốc "${name.trim()}" đã tồn tại trong kho!`
      });
    }

    const medicine = await Medicine.create({
      name: name.trim(),
      activeIngredient: activeIngredient ? activeIngredient.trim() : '',
      unit,
      price: Number(price),
      stockQuantity: Number(stockQuantity),
      minStockAlert: minStockAlert !== undefined ? Number(minStockAlert) : 20,
      usageInstructions: usageInstructions ? usageInstructions.trim() : undefined
    });

    res.status(201).json({
      success: true,
      message: 'Thêm thuốc mới vào kho thành công!',
      data: medicine
    });
  } catch (error) {
    next(error);
  }
};

exports.updateMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thuốc cần cập nhật!'
      });
    }

    const {
      name,
      activeIngredient,
      unit,
      price,
      stockQuantity,
      minStockAlert,
      usageInstructions
    } = req.body;

    if (
      (price !== undefined && Number(price) < 0) ||
      (stockQuantity !== undefined && Number(stockQuantity) < 0) ||
      (minStockAlert !== undefined && Number(minStockAlert) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Đơn giá, số lượng tồn kho và ngưỡng cảnh báo không được là số âm!'
      });
    }

    if (name && name.trim() && name.trim().toLowerCase() !== medicine.name.toLowerCase()) {
      const escapedName = escapeRegex(name.trim());
      const duplicate = await Medicine.findOne({
        _id: { $ne: medicine._id },
        name: { $regex: `^${escapedName}$`, $options: 'i' }
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `Thuốc "${name.trim()}" đã tồn tại trong kho!`
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (activeIngredient !== undefined) updateData.activeIngredient = activeIngredient.trim();
    if (unit !== undefined) updateData.unit = unit;
    if (price !== undefined) updateData.price = Number(price);
    if (stockQuantity !== undefined) updateData.stockQuantity = Number(stockQuantity);
    if (minStockAlert !== undefined) updateData.minStockAlert = Number(minStockAlert);
    if (usageInstructions !== undefined) updateData.usageInstructions = usageInstructions.trim();

    const updatedMedicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin thuốc thành công!',
      data: updatedMedicine
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thuốc cần xóa!'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Xóa thuốc khỏi kho thành công!'
    });
  } catch (error) {
    next(error);
  }
};
