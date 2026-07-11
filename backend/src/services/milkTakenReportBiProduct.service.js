const milkTakenReportBiProductRepository = require('../repositories/milkTakenReportBiProduct.repository');
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

class MilkTakenReportBiProductService {
  async getAllRecords(filters = {}) {
    const formatted = { ...filters };
    if (formatted.date)      formatted.date      = formatDate(formatted.date);
    if (formatted.date_from) formatted.date_from = formatDate(formatted.date_from);
    if (formatted.date_to)   formatted.date_to   = formatDate(formatted.date_to);
    return await milkTakenReportBiProductRepository.findAll(formatted);
  }

  async getRecordById(id) {
    const record = await milkTakenReportBiProductRepository.findById(id);
    if (!record) throw new Error('Milk taken report (bi-product) record not found');
    return record;
  }

  async createRecord(data, userId) {
    const recordData = {
      ...data,
      date: formatDate(data.date),
      created_by: userId,
    };

    const recordId = await milkTakenReportBiProductRepository.create(recordData);

    await activityRepository.create({
      user_id: userId,
      action: 'create',
      entity_type: 'milk_taken_report_bi_product',
      entity_id: recordId,
      details: `Created milk taken report (bi-product) for ${data.product_name} on ${formatDate(data.date)}`,
    });

    return await milkTakenReportBiProductRepository.findById(recordId);
  }

  async updateRecord(id, data, userId) {
    const existing = await milkTakenReportBiProductRepository.findById(id);
    if (!existing) throw new Error('Milk taken report (bi-product) record not found');

    const updateData = { ...data };
    if (updateData.date) updateData.date = formatDate(updateData.date);

    await milkTakenReportBiProductRepository.update(id, updateData);

    await activityRepository.create({
      user_id: userId,
      action: 'update',
      entity_type: 'milk_taken_report_bi_product',
      entity_id: id,
      details: `Updated milk taken report (bi-product) for ${existing.product_name} on ${existing.date}`,
    });

    return await milkTakenReportBiProductRepository.findById(id);
  }

  async deleteRecord(id, userId) {
    const existing = await milkTakenReportBiProductRepository.findById(id);
    if (!existing) throw new Error('Milk taken report (bi-product) record not found');

    await milkTakenReportBiProductRepository.delete(id);

    await activityRepository.create({
      user_id: userId,
      action: 'delete',
      entity_type: 'milk_taken_report_bi_product',
      entity_id: id,
      details: `Deleted milk taken report (bi-product) for ${existing.product_name} on ${existing.date}`,
    });

    return { message: 'Record deleted successfully' };
  }
}

module.exports = new MilkTakenReportBiProductService();
