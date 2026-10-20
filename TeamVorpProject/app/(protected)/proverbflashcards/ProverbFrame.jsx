import styles from "./proverbs.module.css";

export default function ProverbFrame({ title, subtitle, narrow = false, fit = false, children }) {
    const shellClass = fit ? `${styles.shell} ${styles.fit}` : styles.shell;

    return (
        <div className={shellClass}>
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