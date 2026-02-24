import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import styles from './AuthPage.module.css'

export default function SignupPage() {
  const [form, setForm] = useState({ email: '', password: '', passwordConfirm: '', username: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (form.password !== form.passwordConfirm) {
      return setError('비밀번호가 일치하지 않습니다.')
    }
    if (form.password.length < 6) {
      return setError('비밀번호는 6자 이상이어야 합니다.')
    }

    setLoading(true)
    const { error } = await signUp(form.email, form.password, form.username)
    setLoading(false)

    if (error) {
      setError(error.message || '회원가입에 실패했습니다.')
    } else {
      setDone(true)
    }
  }

  if (done) {
    return (
      <div className={styles.page}>
        <div className={styles.box}>
          <div className={styles.header}>
            <BookOpen size={36} className={styles.logo} />
            <h1>회원가입 완료!</h1>
            <p>이메일 인증 후 로그인해 주세요 📬</p>
          </div>
          <button onClick={() => navigate('/login')} className={`btn-primary ${styles.submitBtn}`}>
            로그인 페이지로 이동
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.box}>
        <div className={styles.header}>
          <BookOpen size={36} className={styles.logo} />
          <h1>회원가입</h1>
          <p>함께 취미를 나눠요 🌸</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>닉네임</label>
            <input
              name="username"
              placeholder="사용할 닉네임"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>이메일</label>
            <input
              type="email"
              name="email"
              placeholder="이메일 주소"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>비밀번호</label>
            <input
              type="password"
              name="password"
              placeholder="6자 이상"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>비밀번호 확인</label>
            <input
              type="password"
              name="passwordConfirm"
              placeholder="비밀번호 재입력"
              value={form.passwordConfirm}
              onChange={handleChange}
              required
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
            <UserPlus size={16} />
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className={styles.switchLink}>
          이미 계정이 있으신가요?{' '}
          <Link to="/login">로그인</Link>
        </p>
      </div>
    </div>
  )
}
