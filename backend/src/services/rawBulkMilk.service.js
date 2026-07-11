const rawBulkMilkRepository = require('../repositories/rawBulkMilk.repository');
const activityRepository = require('../repositories/activity.repository');

const toDateStr = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

class RawBulkMilkService {
  async getAllRecords(filters = {}) {
    const fmt = { ...filters };
    if (fmt.date)      fmt.date      = toDateStr(fmt.date);
    if (fmt.date_from) fmt.date_from = toDateStr(fmt.date_from);
    if (fmt.date_to)   fmt.date_to   = toDateStr(fmt.date_to);
    return await rawBulkMilkRepository.findAll(fmt);
  }

  async getRecordById(id) {
    const record = await rawBulkMilkRepository.findById(id);
    if (!record) throw new Error('Raw bulk milk testing record not found');
    return record;
  }

  async createRecord(data, userId) {
    const recordData = { ...data, date: toDateStr(data.date), created_by: userId };
    const recordId = await rawBulkMilkRepository.create(recordData);

    await activityRepository.create({
      user_id: userId,
      action: 'create',
      entity_type: 'raw_bulk_milk_testing_record',
      entity_id: recordId,
      details: `Created raw bulk milk record: ${data.sample_name} on ${toDateStr(data.date)}`,
    });

    return await rawBulkMilkRepository.findById(recordId);
  }

  async updateRecord(id, data, userId) {
    const existing = await rawBulkMilkRepository.findById(id);
    if (!existing) throw new Error('Raw bulk milk testing record not found');

    const updateData = { ...data };
    if (updateData.date) updateData.date = toDateStr(updateData.date);
    await rawBulkMilkRepository.update(id, updateData);

    await activityRepository.create({
      user_id: userId,
      action: 'update',
      entity_type: 'raw_bulk_milk_testing_record',
      entity_id: id,
      details: `Updated raw bulk milk record: ${existing.sample_name}`,
    });

    return await rawBulkMilkRepository.findById(id);
  }

  async deleteRecord(id, userId) {
    const existing = await rawBulkMilkRepository.findById(id);
    if (!existing) throw new Error('Raw bulk milk testing record not found');
    await rawBulkMilkRepository.delete(id);

    await activityRepository.create({
      user_id: userId,
      action: 'delete',
      entity_type: 'raw_bulk_milk_testing_record',
      entity_id: id,
      details: `Deleted raw bulk milk record: ${existing.sample_name}`,
    });

    return { message: 'Record deleted successfully' };
  }

  async approveRecord(id, { action, comment }, userId) {
    const existing = await rawBulkMilkRepository.findById(id);
    if (!existing) throw new Error('Raw bulk milk testing record not found');

    if (!['approved', 'rejected'].includes(action)) {
      throw new Error('Invalid action — must be approved or rejected');
    }

    await rawBulkMilkRepository.approve(id, {
      status: action,
      approved_by: userId,
      approval_comment: comment || null,
    });

    await activityRepository.create({
      user_id: userId,
      action,
      entity_type: 'raw_bulk_milk_testing_record',
      entity_id: id,
      details: `${action === 'approved' ? 'Approved' : 'Rejected'} raw bulk milk record: ${existing.sample_name}${
        comment ? ` — Comment: ${comment}` : ''
      }`,
    });

    return await rawBulkMilkRepository.findById(id);
  }
}

module.exports = new RawBulkMilkService();
