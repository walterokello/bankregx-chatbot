import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/MobileNav.module.css';

const links = [
  { href: '/', label: 'Home' },
  { href: '/regulatory-news', label: 'Regulatory Intelligence' },
  { href: '/docs', label: 'Docs' },
  { href: '/security-governance', label: 'Security & Governance' },
  { href: '/admin', label: 'Governance Admin', private: true },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const header = useRef(null);
  const toggle = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const close = () => setOpen(false);
    router.events.on('routeChangeStart', close);
    const desktop = window.matchMedia('(min-width: 851px)');
    const onResize = () => { if (desktop.matches) close(); };
    desktop.addEventListener('change', onResize);
    return () => { router.events.off('routeChangeStart', close); desktop.removeEventListener('change', onResize); };
  }, [router.events]);

  useEffect(() => {
    if (!open) return;
    const onKey = event => {
      if (event.key === 'Escape') { setOpen(false); toggle.current?.focus(); }
    };
    const onPointer = event => { if (!header.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onPointer); };
  }, [open]);

  return <header ref={header} className={styles.header} aria-label="BankRegX mobile navigation">
    <div className={styles.row}>
      <Link href="/" className={styles.brand} onClick={() => setOpen(false)} aria-label="BankRegX home">
        <span className={styles.badge} aria-hidden="true">BRX</span><span>BankRegX</span>
      </Link>
      <button ref={toggle} type="button" className={styles.toggle} aria-expanded={open} aria-controls="bankregx-mobile-menu" onClick={() => setOpen(value => !value)}>
        {open ? 'Close' : 'Menu'}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d={open ? 'M6 6l12 12M6 18L18 6' : 'M4 6h16M4 12h16M4 18h16'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </div>
    {open && <nav id="bankregx-mobile-menu" className={styles.menu} aria-label="Main navigation">
      <p className={styles.label}>EXPLORE BANKREGX</p>
      {links.map(link => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} aria-current={router.pathname === link.href ? 'page' : undefined} className={`${styles.link} ${link.private ? styles.admin : ''}`}>
        <span>{link.label}</span>{link.private ? <span className={styles.private}>PRIVATE</span> : <span aria-hidden="true">→</span>}
      </Link>)}
    </nav>}
  </header>;
}
