import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Heart, MessageCircle, Edit2, Trash2, ArrowLeft, Send } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Loading from '../components/common/Loading'
import styles from './PostDetailPage.module.css'

export default function PostDetailPage() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [post, setPost] = useState(null)
  const [images, setImages] = useState([])
  const [comments, setComments] = useState([])
  const [likes, setLikes] = useState([])
  const [liked, setLiked] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [id])

  async function fetchAll() {
    const [postRes, imgRes, commentRes, likeRes] = await Promise.all([
      supabase.from('posts').select('*, profiles(username)').eq('id', id).single(),
      supabase.from('post_images').select('*').eq('post_id', id),
      supabase.from('comments').select('*, profiles(username)').eq('post_id', id).order('created_at'),
      supabase.from('likes').select('*').eq('post_id', id),
    ])

    setPost(postRes.data)
    setImages(imgRes.data || [])
    setComments(commentRes.data || [])
    setLikes(likeRes.data || [])
    if (user) {
      setLiked((likeRes.data || []).some(l => l.user_id === user.id))
    }
    setLoading(false)
  }

  async function toggleLike() {
    if (!user) return navigate('/login')
    if (liked) {
      await supabase.from('likes').delete().eq('post_id', id).eq('user_id', user.id)
      setLikes(prev => prev.filter(l => l.user_id !== user.id))
      setLiked(false)
    } else {
      const { data } = await supabase.from('likes').insert({ post_id: id, user_id: user.id }).select().single()
      setLikes(prev => [...prev, data])
      setLiked(true)
    }
  }

  async function handleComment(e) {
    e.preventDefault()
    if (!commentText.trim()) return
    if (!user) return navigate('/login')

    setSubmitting(true)
    const { data } = await supabase
      .from('comments')
      .insert({ post_id: id, user_id: user.id, content: commentText.trim() })
      .select('*, profiles(username)')
      .single()

    if (data) {
      setComments(prev => [...prev, data])
      setCommentText('')
    }
    setSubmitting(false)
  }

  async function deleteComment(commentId) {
    await supabase.from('comments').delete().eq('id', commentId)
    setComments(prev => prev.filter(c => c.id !== commentId))
  }

  async function deletePost() {
    if (!confirm('정말 게시물을 삭제할까요?')) return
    await supabase.from('posts').delete().eq('id', id)
    navigate('/')
  }

  if (loading) return <Loading />
  if (!post) return <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>게시물을 찾을 수 없어요.</div>

  const date = new Date(post.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
  const isOwner = user?.id === post.user_id

  return (
    <div className="container">
      <div className={styles.wrap}>
        {/* 뒤로가기 */}
        <button onClick={() => navigate(-1)} className={styles.backBtn}>
          <ArrowLeft size={16} /> 목록으로
        </button>

        {/* 게시물 */}
        <article className={styles.post}>
          <div className={styles.postHeader}>
            <h1 className={styles.title}>{post.title}</h1>
            <div className={styles.meta}>
              <span className={styles.author}>{post.profiles?.username || '익명'}</span>
              <span className={styles.date}>{date}</span>
            </div>
          </div>

          {/* 이미지 */}
          {images.length > 0 && (
            <div className={styles.images}>
              {images.map(img => (
                <img key={img.id} src={img.image_url} alt="게시물 이미지" className={styles.postImg} />
              ))}
            </div>
          )}

          {/* 본문 */}
          <div className={styles.content}>
            {post.content.split('\n').map((line, i) => (
              <p key={i}>{line || <br />}</p>
            ))}
          </div>

          {/* 액션 버튼 */}
          <div className={styles.actions}>
            <button
              onClick={toggleLike}
              className={`${styles.likeBtn} ${liked ? styles.liked : ''}`}
            >
              <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
              {likes.length}
            </button>
            <span className={styles.commentCount}>
              <MessageCircle size={18} /> {comments.length}
            </span>

            {isOwner && (
              <div className={styles.ownerBtns}>
                <Link to={`/posts/${id}/edit`} className={styles.editBtn}>
                  <Edit2 size={15} /> 수정
                </Link>
                <button onClick={deletePost} className={styles.deleteBtn}>
                  <Trash2 size={15} /> 삭제
                </button>
              </div>
            )}
          </div>
        </article>

        {/* 댓글 */}
        <section className={styles.comments}>
          <h2 className={styles.commentsTitle}>
            <MessageCircle size={18} /> 댓글 {comments.length}개
          </h2>

          <form onSubmit={handleComment} className={styles.commentForm}>
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder={user ? '댓글을 남겨보세요...' : '로그인 후 댓글을 작성할 수 있어요'}
              disabled={!user}
              className={styles.commentInput}
            />
            <button type="submit" className="btn-primary" disabled={!user || submitting}>
              <Send size={15} />
            </button>
          </form>

          <div className={styles.commentList}>
            {comments.map(comment => (
              <div key={comment.id} className={styles.comment}>
                <div className={styles.commentHeader}>
                  <span className={styles.commentAuthor}>{comment.profiles?.username || '익명'}</span>
                  <span className={styles.commentDate}>
                    {new Date(comment.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <p className={styles.commentContent}>{comment.content}</p>
                {user?.id === comment.user_id && (
                  <button onClick={() => deleteComment(comment.id)} className={styles.commentDelete}>
                    삭제
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
