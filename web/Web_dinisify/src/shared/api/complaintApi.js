import { request } from './client';
const typeMap = { Track: 0, User: 1, Comment: 2 };
export const complaintApi = {
  /**
   * @param {string} targetType
   * @param {number} targetId
   * @param {string} reason
   */

  
  create: (targetType, targetId, reason) =>
    request('/api/complaints', {
      method: 'POST',
      body: { targetType: typeMap[targetType] ?? 0, targetId, reason },
    }),
};