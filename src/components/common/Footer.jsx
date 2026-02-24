import { Flower2, PenLine, BookOpen, NotebookPen } from 'lucide-react'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.icons}>
          <Flower2 size={18} />
          <PenLine size={18} />
          <BookOpen size={18} />
          <NotebookPen size={18} />
        </div>
        <p className={styles.text}>
          다이어리를 하나만 사자 &mdash; 취미를 나누는 작은 공간 🌸
        </p>
        <p className={styles.copy}>© 2026 All rights reserved.</p>
      </div>
    </footer>
  )
}
