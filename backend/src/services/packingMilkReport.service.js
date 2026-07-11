const packingMilkReportRepository = require('../repositories/packingMilkReport.repository');
const activityRepository = require('../repositories/activity.repository');

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const year  = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day   = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

class PackingMilkReportService {
  async getAllRecords(filters = {}) {
    const formatted = { ...filters };
    if (formatted.date)      formatted.date      = formatDate(formatted.date);
    if (formatted.date_from) formatted.date_from = formatDate(formatted.date_from);
    if (formatted.date_to)   formatted.date_to   = formatDate(formatted.date_to);
    return await packingMilkReportRepository.findAll(formatted);
  }

  async getRecordById(id) {
    const record = await packingMilkReportRepository.findById(id);
    if (!record) throw new Error('Packing milk report record not found');
    return record;
  }

  async createRecord(data, userId) {
    const recordData = {
      ...data,
      date: formatDate(data.date),
      created_by: userId,
    };

    const recordId = await packingMilkReportRepository.create(recordData);

    await activityRepository.create({
      user_id: userId,
      action: 'create',
      entity_type: 'packing_milk_report',
      entity_id: recordId,
      details: `Created packing milk report for tank ${data.tank_no}, batch ${data.batch_no} on ${formatDate(data.date)}`,
    });

    return await packingMilkReportRepository.findById(recordId);
  }

  async updateRecord(id, data, userId) {
    const existing = await packingMilkReportRepository.findById(id);
    if (!existing) throw new Error('Packing milk report record not found');

    const updateData = { ...data };
    if (updateData.date) updateData.date = formatDate(updateData.date);

    await packingMilkReportRepository.update(id, updateData);

    await activityRepository.create({
      user_id: userId,
      action: 'update',
      entity_type: 'packing_milk_report',
      entity_id: id,
      details: `Updated packing milk report for tank ${existing.tank_no}, batch ${existing.batch_no}`,
    });

    return await packingMilkReportRepository.findById(id);
  }

  async deleteRecord(id, userId) {
    const existing = await packingMilkReportRepository.findById(id);
    if (!existing) throw new Error('Packing milk report record not found');

    await packingMilkReportRepository.delete(id);

    await activityRepository.create({
      user_id: userId,
      action: 'delete',
      entity_type: 'packing_milk_report',
      entity_id: id,
      details: `Deleted packing milk report for tank ${existing.tank_no}, batch ${existing.batch_no}`,
    });

    return { message: 'Record deleted successfully' };
  }
}

module.exports = new PackingMilkReportService();
