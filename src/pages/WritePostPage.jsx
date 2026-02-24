import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ImagePlus, X, Send } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Loading from '../components/common/Loading'
import styles from './WritePostPage.module.css'

export default function WritePostPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { user } = useAuth()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user])

  useEffect(() => {
    if (isEdit) loadPost()
  }, [id])

  async function loadPost() {
    const { data } = await supabase.from('posts').select('*').eq('id', id).single()
    if (!data || data.user_id !== user?.id) {
      navigate('/')
      return
    }
    setTitle(data.title)
    setContent(data.content)
    const { data: imgs } = await supabase.from('post_images').select('*').eq('post_id', id)
    setExistingImages(imgs || [])
    setLoading(false)
  }

  function handleFileChange(e) {
    const selected = Array.from(e.target.files)
    setFiles(prev => [...prev, ...selected])
    const newPreviews = selected.map(f => URL.createObjectURL(f))
    setPreviews(prev => [...prev, ...newPreviews])
  }

  function removeNewFile(index) {
    setFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  async function removeExistingImage(img) {
    const path = img.image_url.split('/post-images/')[1]
    await supabase.storage.from('post-images').remove([path])
    await supabase.from('post_images').delete().eq('id', img.id)
    setExistingImages(prev => prev.filter(i => i.id !== img.id))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setError('')
    setSubmitting(true)

    try {
      let postId = id

      if (isEdit) {
        const { error: updateError } = await supabase
          .from('posts')
          .update({ title: title.trim(), content: content.trim() })
          .eq('id', id)
        if (updateError) throw updateError
      } else {
        const { data, error: insertError } = await supabase
          .from('posts')
          .insert({ user_id: user.id, title: title.trim(), content: content.trim() })
          .select()
          .single()
        if (insertError) throw insertError
        postId = data.id
      }

      // 이미지 업로드
      for (const file of files) {
        const ext = file.name.split('.').pop()
        const path = `${user.id}/${postId}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(path, file)
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('post-images')
            .getPublicUrl(path)
          await supabase.from('post_images').insert({ post_id: postId, image_url: publicUrl })
        }
      }

      navigate(`/posts/${postId}`)
    } catch (err) {
      console.error('게시물 저장 오류:', err)
      setError(err.message || '게시물 저장에 실패했습니다. 다시 시도해 주세요.')
      setSubmitting(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="container">
      <div className={styles.wrap}>
        <h1 className={styles.pageTitle}>{isEdit ? '게시물 수정' : '새 글 작성'}</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label>제목</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              required
            />
          </div>

          <div className="form-group">
            <label>내용</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="오늘의 다꾸, 독서 기록, 취미를 나눠보세요 🌸"
              rows={10}
              required
            />
          </div>

          <div className={styles.imageSection}>
            <label className={styles.imageLabel}>
              <ImagePlus size={18} />
              사진 추가
              <input type="file" accept="image/*" multiple onChange={handleFileChange} hidden />
            </label>

            {existingImages.map(img => (
              <div key={img.id} className={styles.imgPreview}>
                <img src={img.image_url} alt="기존 이미지" />
                <button type="button" onClick={() => removeExistingImage(img)} className={styles.removeImg}>
                  <X size={14} />
                </button>
              </div>
            ))}

            {previews.map((src, i) => (
              <div key={i} className={styles.imgPreview}>
                <img src={src} alt="미리보기" />
                <button type="button" onClick={() => removeNewFile(i)} className={styles.removeImg}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          {error && <p className="error-text">{error}</p>}

          <div className={styles.formActions}>
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
              취소
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              <Send size={15} />
              {submitting ? '저장 중...' : isEdit ? '수정 완료' : '게시하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
