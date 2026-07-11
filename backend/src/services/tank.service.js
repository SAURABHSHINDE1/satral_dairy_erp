const tankRepository = require('../repositories/tank.repository');
const approvalRepository = require('../repositories/approval.repository');
const activityRepository = require('../repositories/activity.repository');
const notificationRepository = require('../repositories/notification.repository');

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

class TankService {
  async getAllTankRecords(filters = {}) {
    const formattedFilters = { ...filters };
    if (formattedFilters.date_from) {
      formattedFilters.date_from = formatDate(formattedFilters.date_from);
    }
    if (formattedFilters.date_to) {
      formattedFilters.date_to = formatDate(formattedFilters.date_to);
    }
    return await tankRepository.findAll(formattedFilters);
  }

  async getTankRecordById(id) {
    const record = await tankRepository.findById(id);
    if (!record) {
      throw new Error('Tank record not found');
    }
    return record;
  }

  async createTankRecord(tankData, userId) {
    const formattedReleaseTime = tankData.tank_release_time && tankData.date
      ? `${formatDate(tankData.date)} ${tankData.tank_release_time}`
      : null;

    const record = {
      ...tankData,
      tank_release_time: formattedReleaseTime,
      process_operator_id: userId,
      status: 'pending_lab'
    };

    const recordId = await tankRepository.create(record);

    // Log activity
    await activityRepository.create({
      user_id: userId,
      action: 'create',
      entity_type: 'tank_record',
      entity_id: recordId,
      details: `Created tank record for tank ${tankData.tank_number}`
    });

    // Notify lab incharges
    // (You would need to get all lab incharges and create notifications)

    return await tankRepository.findById(recordId);
  }

  async updateTankRecord(id, tankData, userId, userRole) {
    const existingRecord = await tankRepository.findById(id);
    if (!existingRecord) {
      throw new Error('Tank record not found');
    }

    // Check permissions
    if (userRole === 'operator' && existingRecord.process_operator_id !== userId) {
      throw new Error('You can only edit your own records');
    }

    if (existingRecord.status === 'approved') {
      throw new Error('Cannot edit approved records');
    }

    const updatedData = { ...tankData };
    const date = updatedData.date || existingRecord.date;
    if (updatedData.tank_release_time && date) {
      const dateStr = formatDate(date);
      const timeStr = updatedData.tank_release_time.includes(' ')
        ? updatedData.tank_release_time.split(' ')[1]
        : updatedData.tank_release_time;
      updatedData.tank_release_time = `${dateStr} ${timeStr}`;
    }

    await tankRepository.update(id, updatedData);

    // Log activity
    await activityRepository.create({
      user_id: userId,
      action: 'update',
      entity_type: 'tank_record',
      entity_id: id,
      details: `Updated tank record for tank ${existingRecord.tank_number}`
    });

    return await tankRepository.findById(id);
  }

  async deleteTankRecord(id, userId, userRole) {
    const existingRecord = await tankRepository.findById(id);
    if (!existingRecord) {
      throw new Error('Tank record not found');
    }

    if (userRole === 'operator') {
      throw new Error('Operators cannot delete records');
    }

    if (existingRecord.status === 'approved') {
      throw new Error('Cannot delete approved records');
    }

    await tankRepository.delete(id);

    // Log activity
    await activityRepository.create({
      user_id: userId,
      action: 'delete',
      entity_type: 'tank_record',
      entity_id: id,
      details: `Deleted tank record for tank ${existingRecord.tank_number}`
    });

    return { message: 'Record deleted successfully' };
  }

  async submitForLabApproval(id, userId, userRole) {
    const existingRecord = await tankRepository.findById(id);
    if (!existingRecord) {
      throw new Error('Tank record not found');
    }

    if (userRole === 'operator' && existingRecord.process_operator_id !== userId) {
      throw new Error('You can only submit your own records');
    }

    await tankRepository.update(id, { status: 'pending_lab' });

    // Log activity
    await activityRepository.create({
      user_id: userId,
      action: 'submit',
      entity_type: 'tank_record',
      entity_id: id,
      details: `Submitted tank record for lab approval`
    });

    return await tankRepository.findById(id);
  }

  async approveByLab(id, labInchargeId, remarks) {
    const existingRecord = await tankRepository.findById(id);
    if (!existingRecord) {
      throw new Error('Tank record not found');
    }

    if (existingRecord.status !== 'pending_lab') {
      throw new Error('Record is not pending lab approval');
    }

    // Update tank record
    await tankRepository.update(id, {
      lab_incharge_id: labInchargeId,
      status: 'pending_admin'
    });

    // Create approval record
    await approvalRepository.create({
      tank_record_id: id,
      approver_id: labInchargeId,
      approver_role: 'lab_incharge',
      action: 'approved',
      comments: remarks
    });

    // Log activity
    await activityRepository.create({
      user_id: labInchargeId,
      action: 'approve',
      entity_type: 'tank_record',
      entity_id: id,
      details: `Lab approved tank record`
    });

    return await tankRepository.findById(id);
  }

  async rejectByLab(id, labInchargeId, remarks) {
    const existingRecord = await tankRepository.findById(id);
    if (!existingRecord) {
      throw new Error('Tank record not found');
    }

    if (existingRecord.status !== 'pending_lab') {
      throw new Error('Record is not pending lab approval');
    }

    // Update tank record
    await tankRepository.update(id, {
      lab_incharge_id: labInchargeId,
      status: 'rejected'
    });

    // Create approval record
    await approvalRepository.create({
      tank_record_id: id,
      approver_id: labInchargeId,
      approver_role: 'lab_incharge',
      action: 'rejected',
      comments: remarks
    });

    // Log activity
    await activityRepository.create({
      user_id: labInchargeId,
      action: 'reject',
      entity_type: 'tank_record',
      entity_id: id,
      details: `Lab rejected tank record`
    });

    return await tankRepository.findById(id);
  }

  async approveByAdmin(id, adminId, remarks) {
    const existingRecord = await tankRepository.findById(id);
    if (!existingRecord) {
      throw new Error('Tank record not found');
    }

    if (existingRecord.status !== 'pending_admin') {
      throw new Error('Record is not pending admin approval');
    }

    // Update tank record
    await tankRepository.update(id, { status: 'approved' });

    // Create approval record
    await approvalRepository.create({
      tank_record_id: id,
      approver_id: adminId,
      approver_role: 'admin',
      action: 'approved',
      comments: remarks
    });

    // Log activity
    await activityRepository.create({
      user_id: adminId,
      action: 'approve',
      entity_type: 'tank_record',
      entity_id: id,
      details: `Admin approved tank record`
    });

    return await tankRepository.findById(id);
  }

  async rejectByAdmin(id, adminId, remarks) {
    const existingRecord = await tankRepository.findById(id);
    if (!existingRecord) {
      throw new Error('Tank record not found');
    }

    if (existingRecord.status !== 'pending_admin') {
      throw new Error('Record is not pending admin approval');
    }

    // Update tank record
    await tankRepository.update(id, { status: 'rejected' });

    // Create approval record
    await approvalRepository.create({
      tank_record_id: id,
      approver_id: adminId,
      approver_role: 'admin',
      action: 'rejected',
      comments: remarks
    });

    // Log activity
    await activityRepository.create({
      user_id: adminId,
      action: 'reject',
      entity_type: 'tank_record',
      entity_id: id,
      details: `Admin rejected tank record`
    });

    return await tankRepository.findById(id);
  }

  async getStatistics(dateFrom, dateTo) {
    return await tankRepository.getStatistics(formatDate(dateFrom), formatDate(dateTo));
  }

  async getDailyTrend(dateFrom, dateTo) {
    return await tankRepository.getDailyTrend(formatDate(dateFrom), formatDate(dateTo));
  }
}

module.exports = new TankService();
