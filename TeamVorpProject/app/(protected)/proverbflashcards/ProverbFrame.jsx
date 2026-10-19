import styles from "./proverbs.module.css";

export default function ProverbFrame({ title, subtitle, narrow = false, children }) {
    return (
        <div className={styles.shell}>
            <main className={narrow ? `${styles.page} ${styles.narrow}` : styles.page}>
                {title && (
                    <header className={styles.header}>
                        <h1 className={styles.title}>{title}</h1>
                        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                    </header>
                )}
                {children}
            </main>
        </div>
    );
}