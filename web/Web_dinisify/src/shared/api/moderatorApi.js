import { request } from './client';

export const moderatorApi = {
  // Очередь треков на модерации
  getPendingTracks: (page = 1, pageSize = 20) =>
    request(`/moderator/tracks/pending?page=${page}&pageSize=${pageSize}`),

  // Одобрить ('approved') или отклонить ('rejected') трек с причиной
  reviewTrack: (id, status, rejectionReason = null) =>
    request(`/moderator/tracks/${id}/review`, {
      method: 'PUT',
      body: {
        status,
        rejectionReason,
      },
    }),

  // Редактировать метаданные трека (название, альбом, жанры)
  updateTrack: (id, payload) =>
    request(`/tracks/${id}`, {
      method: 'PUT',
      body: payload,
    }),

  // Удалить некорректный трек (мягкое удаление, доступно Mod+)
  deleteTrack: (id) =>
    request(`/tracks/${id}`, {
      method: 'DELETE',
    }),

  // Удалить некорректный комментарий (доступно Mod+)
  deleteComment: (id) =>
    request(`/comments/${id}`, {
      method: 'DELETE',
    }),

  // Жалобы пользователей
  getComplaints: (status = 'pending', page = 1, pageSize = 20) =>
    request(`/moderator/complaints?status=${status}&page=${page}&pageSize=${pageSize}`),

  resolveComplaint: (id) =>
    request(`/moderator/complaints/${id}/resolve`, {
      method: 'PUT',
      body: { status: 'resolved' },
    }),

  // Блокировка / разблокировка пользователя (доступно Mod+)
  setUserBlocked: (userId, isBlocked) =>
    request(`/moderator/users/${userId}/block`, {
      method: 'PATCH',
      body: { isBlocked },
    }),

  // В справочнике указан как Admin; оставим хелпер для статистики, если бэк разрешит
  getAnalytics: () => request('/admin/analytics'),
};