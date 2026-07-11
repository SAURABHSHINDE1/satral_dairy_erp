const finalProductRepository = require('../repositories/finalProduct.repository');
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

class FinalProductService {
  async getAllRecords(filters = {}) {
    const formatted = { ...filters };
    if (formatted.date)      formatted.date      = formatDate(formatted.date);
    if (formatted.date_from) formatted.date_from = formatDate(formatted.date_from);
    if (formatted.date_to)   formatted.date_to   = formatDate(formatted.date_to);
    // status filter passed through as-is
    return await finalProductRepository.findAll(formatted);
  }

  async getRecordById(id) {
    const record = await finalProductRepository.findById(id);
    if (!record) throw new Error('Record not found');
    return record;
  }

  async createRecord(data, userId) {
    const recordData = {
      ...data,
      date: formatDate(data.date),
      created_by: userId,
    };

    const recordId = await finalProductRepository.create(recordData);

    await activityRepository.create({
      user_id: userId,
      action: 'create',
      entity_type: 'final_product_storage_record',
      entity_id: recordId,
      details: `Created final product storage record for tank ${data.tank_no} on ${formatDate(data.date)}`,
    });

    return await finalProductRepository.findById(recordId);
  }

  async updateRecord(id, data, userId) {
    const existing = await finalProductRepository.findById(id);
    if (!existing) throw new Error('Record not found');

    const updateData = { ...data };
    if (updateData.date) updateData.date = formatDate(updateData.date);

    await finalProductRepository.update(id, updateData);

    await activityRepository.create({
      user_id: userId,
      action: 'update',
      entity_type: 'final_product_storage_record',
      entity_id: id,
      details: `Updated final product storage record for tank ${existing.tank_no}`,
    });

    return await finalProductRepository.findById(id);
  }

  async deleteRecord(id, userId) {
    const existing = await finalProductRepository.findById(id);
    if (!existing) throw new Error('Record not found');

    await finalProductRepository.delete(id);

    await activityRepository.create({
      user_id: userId,
      action: 'delete',
      entity_type: 'final_product_storage_record',
      entity_id: id,
      details: `Deleted final product storage record for tank ${existing.tank_no}`,
    });

    return { message: 'Record deleted successfully' };
  }

  async approveRecord(id, { action, comment }, userId) {
    const existing = await finalProductRepository.findById(id);
    if (!existing) throw new Error('Record not found');

    if (!['approved', 'rejected'].includes(action)) {
      throw new Error('Invalid action — must be approved or rejected');
    }

    await finalProductRepository.approve(id, {
      status: action,
      approved_by: userId,
      approval_comment: comment || null,
    });

    await activityRepository.create({
      user_id: userId,
      action,
      entity_type: 'final_product_storage_record',
      entity_id: id,
      details: `${action === 'approved' ? 'Approved' : 'Rejected'} final product storage record for tank ${existing.tank_no}${
        comment ? ` — Comment: ${comment}` : ''
      }`,
    });

    return await finalProductRepository.findById(id);
  }
}

module.exports = new FinalProductService();
