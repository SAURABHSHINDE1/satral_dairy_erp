const biProductRepository = require('../repositories/biProduct.repository');
const activityRepository = require('../repositories/activity.repository');

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

class BiProductService {
  async getAllReports(filters = {}) {
    const fmt = { ...filters };
    if (fmt.date)      fmt.date      = formatDate(fmt.date);
    if (fmt.date_from) fmt.date_from = formatDate(fmt.date_from);
    if (fmt.date_to)   fmt.date_to   = formatDate(fmt.date_to);
    return await biProductRepository.findAll(fmt);
  }

  async getReportById(id) {
    const record = await biProductRepository.findById(id);
    if (!record) throw new Error('Bi-product report not found');
    return record;
  }

  async createReport(data, userId) {
    const recordData = {
      ...data,
      date: formatDate(data.date),
      created_by: userId,
    };

    const recordId = await biProductRepository.create(recordData);

    await activityRepository.create({
      user_id: userId,
      action: 'create',
      entity_type: 'bi_product_report',
      entity_id: recordId,
      details: `Created bi-product report for ${data.product_name} (Batch: ${data.batch_no})`,
    });

    return await biProductRepository.findById(recordId);
  }

  async updateReport(id, data, userId) {
    const existing = await biProductRepository.findById(id);
    if (!existing) throw new Error('Bi-product report not found');

    const updateData = { ...data };
    if (updateData.date) updateData.date = formatDate(updateData.date);

    await biProductRepository.update(id, updateData);

    await activityRepository.create({
      user_id: userId,
      action: 'update',
      entity_type: 'bi_product_report',
      entity_id: id,
      details: `Updated bi-product report for ${existing.product_name} (Batch: ${existing.batch_no})`,
    });

    return await biProductRepository.findById(id);
  }

  async deleteReport(id, userId) {
    const existing = await biProductRepository.findById(id);
    if (!existing) throw new Error('Bi-product report not found');

    await biProductRepository.delete(id);

    await activityRepository.create({
      user_id: userId,
      action: 'delete',
      entity_type: 'bi_product_report',
      entity_id: id,
      details: `Deleted bi-product report for ${existing.product_name} (Batch: ${existing.batch_no})`,
    });

    return { message: 'Report deleted successfully' };
  }

  async approveReport(id, { action, comment }, userId) {
    const existing = await biProductRepository.findById(id);
    if (!existing) throw new Error('Bi-product report not found');

    if (!['approved', 'rejected'].includes(action)) {
      throw new Error('Invalid action — must be approved or rejected');
    }

    await biProductRepository.approve(id, {
      status: action,
      approved_by: userId,
      approval_comment: comment || null,
    });

    await activityRepository.create({
      user_id: userId,
      action,
      entity_type: 'bi_product_report',
      entity_id: id,
      details: `${action === 'approved' ? 'Approved' : 'Rejected'} bi-product report for ${existing.product_name} (Batch: ${existing.batch_no})${
        comment ? ` — Comment: ${comment}` : ''
      }`,
    });

    return await biProductRepository.findById(id);
  }
}

module.exports = new BiProductService();
