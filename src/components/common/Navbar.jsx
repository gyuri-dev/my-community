import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, PenLine, LogOut, LogIn, UserPlus } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <nav className={styles.nav}>
      <div className={`container ${styles.inner}`}>
        <Link to="/" className={styles.logo}>
          <BookOpen size={22} />
          <span>다이어리를 하나만 사자</span>
        </Link>

        <div className={styles.actions}>
          {user ? (
            <>
              <Link to="/write" className={styles.writeBtn}>
                <PenLine size={16} />
                글쓰기
              </Link>
              <span className={styles.username}>
                {profile?.username || '사용자'}님
              </span>
              <button onClick={handleSignOut} className={styles.iconBtn} title="로그아웃">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={styles.iconBtn}>
                <LogIn size={18} />
                <span>로그인</span>
              </Link>
              <Link to="/signup" className={`btn-primary ${styles.signupBtn}`}>
                <UserPlus size={16} />
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
