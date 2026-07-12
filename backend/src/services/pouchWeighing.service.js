const pouchWeighingRepository = require('../repositories/pouchWeighing.repository');
const activityRepository       = require('../repositories/activity.repository');

const toDateStr = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

class PouchWeighingService {

  async getByDate(date) {
    const formatted = toDateStr(date);
    return await pouchWeighingRepository.findByDate(formatted);
  }

  async getById(id) {
    const session = await pouchWeighingRepository.findById(id);
    if (!session) throw new Error('Pouch weighing session not found');
    return session;
  }

  async createSession(data, userId) {
    const sessionData = {
      ...data,
      date: toDateStr(data.date),
      created_by: userId,
    };

    const sessionId = await pouchWeighingRepository.createSession(sessionData);

    await activityRepository.create({
      user_id:     userId,
      action:      'create',
      entity_type: 'pouch_weighing_session',
      entity_id:   sessionId,
      details:     `Created pouch weighing session for date: ${sessionData.date}`,
    });

    return await pouchWeighingRepository.findById(sessionId);
  }

  async updateSession(id, data, userId) {
    const existing = await pouchWeighingRepository.findById(id);
    if (!existing) throw new Error('Pouch weighing session not found');

    const updateData = {
      ...data,
      ...(data.date ? { date: toDateStr(data.date) } : {}),
    };

    await pouchWeighingRepository.updateSession(id, updateData);

    await activityRepository.create({
      user_id:     userId,
      action:      'update',
      entity_type: 'pouch_weighing_session',
      entity_id:   id,
      details:     `Updated pouch weighing session for date: ${existing.date}`,
    });

    return await pouchWeighingRepository.findById(id);
  }

  async deleteSession(id, userId) {
    const existing = await pouchWeighingRepository.findById(id);
    if (!existing) throw new Error('Pouch weighing session not found');

    await pouchWeighingRepository.deleteSession(id);

    await activityRepository.create({
      user_id:     userId,
      action:      'delete',
      entity_type: 'pouch_weighing_session',
      entity_id:   id,
      details:     `Deleted pouch weighing session for date: ${existing.date}`,
    });
    return true;
  }

  async submitSession(id, userId) {
    const existing = await pouchWeighingRepository.findById(id);
    if (!existing) throw new Error('Pouch weighing session not found');
    await pouchWeighingRepository.updateSession(id, { status: 'pending_lab' });
    await activityRepository.create({
      user_id: userId,
      action: 'submit',
      entity_type: 'pouch_weighing_session',
      entity_id: id,
      details: `Submitted pouch weighing session for lab approval`
    });
    return await pouchWeighingRepository.findById(id);
  }

  async approveByLab(id, userId) {
    const existing = await pouchWeighingRepository.findById(id);
    if (!existing) throw new Error('Pouch weighing session not found');
    await pouchWeighingRepository.updateSession(id, { status: 'pending_admin' });
    await activityRepository.create({
      user_id: userId,
      action: 'approve',
      entity_type: 'pouch_weighing_session',
      entity_id: id,
      details: `Lab approved pouch weighing session`
    });
    return await pouchWeighingRepository.findById(id);
  }

  async rejectByLab(id, userId) {
    const existing = await pouchWeighingRepository.findById(id);
    if (!existing) throw new Error('Pouch weighing session not found');
    await pouchWeighingRepository.updateSession(id, { status: 'rejected' });
    await activityRepository.create({
      user_id: userId,
      action: 'reject',
      entity_type: 'pouch_weighing_session',
      entity_id: id,
      details: `Lab rejected pouch weighing session`
    });
    return await pouchWeighingRepository.findById(id);
  }

  async approveByAdmin(id, userId) {
    const existing = await pouchWeighingRepository.findById(id);
    if (!existing) throw new Error('Pouch weighing session not found');
    await pouchWeighingRepository.updateSession(id, { status: 'approved' });
    await activityRepository.create({
      user_id: userId,
      action: 'approve',
      entity_type: 'pouch_weighing_session',
      entity_id: id,
      details: `Admin approved pouch weighing session`
    });
    return await pouchWeighingRepository.findById(id);
  }

  async rejectByAdmin(id, userId) {
    const existing = await pouchWeighingRepository.findById(id);
    if (!existing) throw new Error('Pouch weighing session not found');
    await pouchWeighingRepository.updateSession(id, { status: 'rejected' });
    await activityRepository.create({
      user_id: userId,
      action: 'reject',
      entity_type: 'pouch_weighing_session',
      entity_id: id,
      details: `Admin rejected pouch weighing session`
    });
    return await pouchWeighingRepository.findById(id);
  }
}

module.exports = new PouchWeighingService();
