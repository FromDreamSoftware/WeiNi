import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import apiClient from '../api/client';


interface Album {
  id: number;
  title: string;
  coverImageUrl: string;
  photoCount: number;
  createdAt: string;
}

interface Photo {
  id: number;
  imageUrl: string;
  caption: string;
  tags: string;
  uploaderNickname: string;
  createdAt: string;
  comments: Comment[];
}

interface Comment {
  id: number;
  content: string;
  userNickname: string;
  createdAt: string;
}

export default function PhotoAlbumPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'albums' | 'photos'>('albums');
  const [activeAlbum, setActiveAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albumTitle, setAlbumTitle] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCaption, setUploadCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState<Record<number, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadAlbums(); }, []);

  const loadAlbums = async () => {
    try {
      const { data } = await apiClient.get('/albums');
      setAlbums(data);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const createAlbum = async () => {
    if (!albumTitle) return;
    setSubmitting(true);
    try {
      await apiClient.post('/albums', { title: albumTitle });
      setAlbumTitle('');
      loadAlbums();
    } catch { /* ignore */ } finally { setSubmitting(false); }
  };

  const deleteAlbum = async (id: number) => {
    try {
      await apiClient.delete(`/albums/${id}`);
      loadAlbums();
    } catch { /* ignore */ }
  };

  const openAlbum = async (album: Album) => {
    setActiveAlbum(album);
    try {
      const { data } = await apiClient.get(`/albums/${album.id}/photos`);
      setPhotos(data);
    } catch { /* ignore */ }
    setView('photos');
  };

  const uploadPhoto = async () => {
    if (!uploadFile || !activeAlbum) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      if (uploadCaption) formData.append('caption', uploadCaption);
      await apiClient.post(`/albums/${activeAlbum.id}/photos`, formData);
      setUploadFile(null);
      setUploadCaption('');
      if (fileRef.current) fileRef.current.value = '';
      openAlbum(activeAlbum);
      loadAlbums();
    } catch { /* ignore */ } finally { setSubmitting(false); }
  };

  const deletePhoto = async (id: number) => {
    try {
      await apiClient.delete(`/photos/${id}`);
      if (activeAlbum) openAlbum(activeAlbum);
    } catch { /* ignore */ }
  };

  const addComment = async (photoId: number) => {
    const content = commentText[photoId];
    if (!content) return;
    try {
      await apiClient.post(`/photos/${photoId}/comments`, { content });
      setCommentText({ ...commentText, [photoId]: '' });
      if (activeAlbum) openAlbum(activeAlbum);
    } catch { /* ignore */ }
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-text-muted">加载中...</div>;

  if (view === 'albums') {
    return (
      <>
        <h1 className="text-xl text-pink-400 mb-4">📸 情侣相册</h1>

          {/* Create album */}
          <div className="flex gap-2 mb-4">
            <input className="flex-1 border border-border rounded-lg px-3 py-2 text-sm"
              placeholder="相册名称" value={albumTitle}
              onChange={e => setAlbumTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createAlbum()} />
            <button onClick={createAlbum} disabled={submitting || !albumTitle}
              className="bg-pink-400 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50">创建</button>
          </div>

          {albums.length === 0 ? (
            <div className="text-center text-text-muted py-12">创建第一个相册吧~</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {albums.map(album => (
                <motion.div key={album.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  onClick={() => openAlbum(album)}
                  className="bg-surface rounded-2xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                  <div className="h-32 bg-surface-tertiary flex items-center justify-center text-3xl">
                    {album.coverImageUrl ? (
                      <img src={album.coverImageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      '📷'
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-text-primary truncate">{album.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-text-muted">{album.photoCount} 张</span>
                      <button onClick={e => { e.stopPropagation(); deleteAlbum(album.id); }}
                        className="text-xs text-text-muted hover:text-red-400">删除</button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
      </>
    );
  }

  // Photo view
  return (
    <>
      <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setView('albums')} className="text-text-muted hover:text-pink-400">← 返回</button>
          <h1 className="text-lg text-pink-400">{activeAlbum?.title}</h1>
        </div>

        {/* Upload */}
        <div className="bg-surface rounded-2xl shadow-sm p-4 mb-4">
          <input type="file" accept="image/*" ref={fileRef}
            onChange={e => {
              const f = e.target.files?.[0];
              if (f && f.size > 10 * 1024 * 1024) { alert('图片大小不能超过 10MB'); return; }
              setUploadFile(f || null);
            }} className="text-xs mb-2 w-full" />
          <p className="text-xs text-text-muted mb-2">图片不超过 10MB</p>
          <input className="w-full border border-border rounded-lg px-3 py-2 text-xs mb-2"
            placeholder="照片说明（可选）" value={uploadCaption} onChange={e => setUploadCaption(e.target.value)} />
          <button onClick={uploadPhoto} disabled={submitting || !uploadFile}
            className="w-full bg-pink-400 text-white rounded-lg py-2 text-sm disabled:opacity-50">上传照片</button>
        </div>

        {photos.length === 0 ? (
          <div className="text-center text-text-muted py-12">还没有照片，上传第一张吧~</div>
        ) : (
          <div className="space-y-4">
            {photos.map(photo => (
              <motion.div key={photo.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-surface rounded-2xl shadow-sm overflow-hidden">
                <img src={photo.imageUrl} alt={photo.caption || ''} className="w-full object-cover max-h-80" />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {photo.caption && <p className="text-sm text-text-primary">{photo.caption}</p>}
                      <p className="text-xs text-text-muted mt-1">{photo.uploaderNickname} · {photo.createdAt?.slice(0, 10)}</p>
                    </div>
                    <button onClick={() => deletePhoto(photo.id)}
                      className="text-xs text-text-muted hover:text-red-400">删除</button>
                  </div>

                  {/* Comments */}
                  {photo.comments.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-50 space-y-1.5">
                      {photo.comments.map(c => (
                        <div key={c.id} className="text-xs">
                          <span className="text-pink-400">{c.userNickname}</span>
                          <span className="text-text-secondary mx-1">:</span>
                          <span className="text-text-secondary">{c.content}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add comment */}
                  <div className="flex gap-2 mt-3">
                    <input className="flex-1 border border-border rounded-lg px-3 py-1.5 text-xs"
                      placeholder="写评论..." value={commentText[photo.id] || ''}
                      onChange={e => setCommentText({ ...commentText, [photo.id]: e.target.value })}
                      onKeyDown={e => e.key === 'Enter' && addComment(photo.id)} />
                    <button onClick={() => addComment(photo.id)}
                      className="text-xs text-pink-400 hover:text-pink-500 px-2">发送</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
    </>
  );
}
