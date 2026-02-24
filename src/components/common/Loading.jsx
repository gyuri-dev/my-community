import styles from './Loading.module.css'

export default function Loading({ text = '불러오는 중...' }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.spinner} />
      <p>{text}</p>
    </div>
  )
}
