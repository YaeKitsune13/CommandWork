import { useState } from 'react';
import { trackApi } from '../api/trackApi';

export function useUploadTrack() {
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const upload = async ({ audioFile, name, artistId, ownerId, albumId, image }) => {
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      const fd = new FormData();
      fd.append('AudioFile', audioFile);
      fd.append('Name', name);
      fd.append('ArtistId', String(artistId));
      fd.append('OwnerId', String(ownerId));
      if (albumId) fd.append('AlbumId', String(albumId));
      if (image) fd.append('Image', image);

      const result = await trackApi.upload(fd, setProgress);
      return { success: true, track: result };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { upload, progress, loading, error };
}