import { request } from './client';

export const moderatorApi = {
  getPendingMusic: () => request('/api/moderator/music/pending'),
  
  reviewMusic: (id, isApproved, rejectionReason = null) =>
    request('/api/moderator/music/review', {
      method: 'PUT',
      body: { 
        musicId: id,           
        isApproved: isApproved, 
        rejectionReason: rejectionReason 
      },
    }),

  getComplaints: () => request('/api/moderator/complaints'),
  
  resolveComplaint: (id) =>
    request(`/api/moderator/complaints/${id}/resolve`, {
      method: 'PUT',
    }),
};