import styles from "./badgeShowcase.module.css"

function Stars({ level }){
  return (
    <span className={styles.stars} role="img" aria-label={level ? "Level " + level + " of 4" : "No level yet"}>
      {[1, 2, 3, 4].map((n) => (
        <span key={n} className={n <= level ? styles.on : styles.off}>{"\u2605"}</span>
      ))}
    </span>
  )
}

export default function BadgeShowcase({ items }){
  return (
    <ul className={styles.list}>
      {items.map((h) => (
        <li key={h.id} className={styles.item}>
          <span className={styles.label}>{h.label}</span>
          <Stars level={h.level} />
          <span className={styles.value}>{h.value}<small> {h.unit}</small></span>
        </li>
      ))}
    </ul>
  )
}