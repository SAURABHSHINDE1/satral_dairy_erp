const buttermilkAnalysisRecordRepository = require('../repositories/buttermilkAnalysisRecord.repository');
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

class ButtermilkAnalysisRecordService {
  async getAllRecords(filters = {}) {
    const formatted = { ...filters };
    if (formatted.date) formatted.date = formatDate(formatted.date);
    return await buttermilkAnalysisRecordRepository.findAll(formatted);
  }

  async getRecordById(id) {
    const record = await buttermilkAnalysisRecordRepository.findById(id);
    if (!record) throw new Error('Buttermilk analysis record not found');
    return record;
  }

  async createRecord(data, userId) {
    const recordData = {
      ...data,
      date: formatDate(data.date),
      created_by: userId,
    };

    const recordId = await buttermilkAnalysisRecordRepository.create(recordData);

    await activityRepository.create({
      user_id: userId,
      action: 'create',
      entity_type: 'buttermilk_analysis_record',
      entity_id: recordId,
      details: `Created buttermilk analysis record for date ${formatDate(data.date)}, shift ${data.shift}, batch ${data.batch_no}`,
    });

    return await buttermilkAnalysisRecordRepository.findById(recordId);
  }

  async updateRecord(id, data, userId) {
    const existing = await buttermilkAnalysisRecordRepository.findById(id);
    if (!existing) throw new Error('Buttermilk analysis record not found');

    const updateData = { ...data };
    if (updateData.date) updateData.date = formatDate(updateData.date);

    await buttermilkAnalysisRecordRepository.update(id, updateData);

    await activityRepository.create({
      user_id: userId,
      action: 'update',
      entity_type: 'buttermilk_analysis_record',
      entity_id: id,
      details: `Updated buttermilk analysis record for date ${existing.date}, shift ${existing.shift}, batch ${existing.batch_no}`,
    });

    return await buttermilkAnalysisRecordRepository.findById(id);
  }
}

module.exports = new ButtermilkAnalysisRecordService();
