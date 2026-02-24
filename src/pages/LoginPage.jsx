import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import styles from './AuthPage.module.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
    } else {
      navigate('/')
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.box}>
        <div className={styles.header}>
          <BookOpen size={36} className={styles.logo} />
          <h1>다이어리를 하나만 사자</h1>
          <p>로그인하고 취미를 나눠요 🌸</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>이메일</label>
            <input
              type="email"
              placeholder="이메일을 입력하세요"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>비밀번호</label>
            <input
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
            <LogIn size={16} />
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className={styles.switchLink}>
          계정이 없으신가요?{' '}
          <Link to="/signup">회원가입</Link>
        </p>
      </div>
    </div>
  )
}
