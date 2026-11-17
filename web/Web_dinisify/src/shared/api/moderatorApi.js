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

  getComplaints: () => request('/moderator/complaints'),
  
  resolveComplaint: (id) =>
    request(`/moderator/complaints/${id}/resolve`, {
      method: 'PUT',
    }),
};