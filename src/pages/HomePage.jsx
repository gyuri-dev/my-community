import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Image, Flower2, BookOpen, PenLine, NotebookPen } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Loading from '../components/common/Loading'
import styles from './HomePage.module.css'

export default function HomePage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    const { data } = await supabase
      .from('posts')
      .select(`
        id, title, content, created_at,
        profiles(username),
        post_images(image_url),
        likes(id),
        comments(id)
      `)
      .order('created_at', { ascending: false })

    setPosts(data || [])
    setLoading(false)
  }

  return (
    <div>
      {/* 히어로 배너 */}
      <div className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroIcons}>
            <Flower2 size={28} />
            <PenLine size={28} />
            <BookOpen size={28} />
            <NotebookPen size={28} />
          </div>
          <h1 className={styles.heroTitle}>다이어리를 하나만 사자</h1>
          <p className={styles.heroSub}>
            다꾸, 독서, 취미 기록을 함께 나눠요 🌸
          </p>
          <Link to="/write" className={`btn-primary ${styles.heroBtn}`}>
            <PenLine size={16} />
            글쓰기
          </Link>
        </div>
      </div>

      {/* 게시물 목록 */}
      <div className="container">
        <h2 className={styles.listTitle}>최근 게시물</h2>

        {loading ? (
          <Loading />
        ) : posts.length === 0 ? (
          <div className={styles.empty}>
            <NotebookPen size={48} />
            <p>아직 게시물이 없어요.<br />첫 번째 글을 남겨보세요!</p>
            <Link to="/write" className="btn-primary">글쓰기</Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PostCard({ post }) {
  const image = post.post_images?.[0]?.image_url
  const likesCount = post.likes?.length || 0
  const commentsCount = post.comments?.length || 0
  const username = post.profiles?.username || '익명'
  const preview = post.content.slice(0, 80) + (post.content.length > 80 ? '...' : '')
  const date = new Date(post.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <Link to={`/posts/${post.id}`} className={styles.card}>
      {image && (
        <div className={styles.cardImg}>
          <img src={image} alt="게시물 이미지" />
        </div>
      )}
      {!image && (
        <div className={styles.cardImgPlaceholder}>
          <NotebookPen size={36} />
        </div>
      )}
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{post.title}</h3>
        <p className={styles.cardPreview}>{preview}</p>
        <div className={styles.cardMeta}>
          <span className={styles.author}>{username}</span>
          <span className={styles.date}>{date}</span>
        </div>
        <div className={styles.cardStats}>
          <span><Heart size={14} /> {likesCount}</span>
          <span><MessageCircle size={14} /> {commentsCount}</span>
          {image && <span><Image size={14} /> 사진</span>}
        </div>
      </div>
    </Link>
  )
}
