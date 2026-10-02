/**
 * DoAide Standard Landing Page Template
 *
 * Usage: Copy this file, rename to LandingPage.jsx, and configure the PRODUCT_CONFIG object.
 *
 * Features:
 * - Robot face icon in header (not full body)
 * - Animated hero with floating gradient orbs
 * - Minimal text, max animations
 * - Feature icons with hover animations
 * - Footer with doaide.com link and product links
 * - Responsive design
 * - Dark theme with configurable accent color
 */

import React, { useEffect, useState } from 'react';

// ============ CONFIGURE THIS FOR EACH PRODUCT ============
const PRODUCT_CONFIG = {
  name: 'Product',           // e.g., 'Pulse', 'Desk', 'Med'
  fullName: 'DoAide Product', // e.g., 'DoAide Pulse'
  tagline: 'Your tagline here.', // One short sentence
  accentColor: '#F0B429',    // Gold/amber default
  accentColorDark: '#D4A017',
  loginPath: '/login',
  registerPath: '/register',
  features: [
    { icon: '⚡', title: 'Feature 1' },
    { icon: '🔒', title: 'Feature 2' },
    { icon: '📊', title: 'Feature 3' },
    { icon: '🤖', title: 'Feature 4' },
  ],
};
// =========================================================

const DOAIDE_PRODUCTS = [
  { name: 'Desk', url: 'https://desk.doaide.com', desc: 'Client CRM' },
  { name: 'Jobs', url: 'https://job.doaide.com', desc: 'Auto Apply' },
  { name: '409A', url: 'https://409a.doaide.com', desc: 'Valuations' },
  { name: 'GST', url: 'https://gst.doaide.com', desc: 'Tax Filing' },
  { name: 'Pulse', url: 'https://pulse.doaide.com', desc: 'Newsletters' },
  { name: 'Med', url: 'https://med.doaide.com', desc: 'Clinical AI' },
  { name: 'Realty', url: 'https://realty.doaide.com', desc: 'Real Estate' },
  { name: 'Reach', url: 'https://reach.doaide.com', desc: 'Outreach' },
  { name: 'Trade', url: 'https://trade.doaide.com', desc: 'Trading' },
  { name: 'Cortex', url: 'https://cortex.doaide.com', desc: 'Agent Memory' },
];

// Robot face SVG (head only, no body)
const RobotFace = ({ size = 32, color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size}>
    <line x1="16" y1="6" x2="16" y2="2" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="16" cy="1.5" r="1.5" fill={color}/>
    <rect x="5" y="6" width="22" height="17" rx="5" fill={color}/>
    <ellipse cx="11" cy="13" rx="2.5" ry="3" fill="#0A0A0B"/>
    <ellipse cx="21" cy="13" rx="2.5" ry="3" fill="#0A0A0B"/>
    <circle cx="11.5" cy="12.5" r="1" fill={color} opacity="0.6"/>
    <circle cx="21.5" cy="12.5" r="1" fill={color} opacity="0.6"/>
    <path d="M12 19Q16 22 20 19" stroke="#0A0A0B" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    <rect x="1" y="10" width="4" height="5" rx="2" fill={color} opacity="0.8"/>
    <rect x="27" y="10" width="4" height="5" rx="2" fill={color} opacity="0.8"/>
  </svg>
);

// Large animated robot for hero
const HeroRobot = ({ color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 100" width="120" height="100" className="landing-hero-robot">
    <line x1="60" y1="18" x2="60" y2="6" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="60" cy="4" r="3" fill={color} className="landing-antenna-glow"/>
    <rect x="25" y="18" width="70" height="55" rx="16" fill={color}/>
    <ellipse cx="42" cy="40" rx="8" ry="10" fill="#0A0A0B"/>
    <ellipse cx="78" cy="40" rx="8" ry="10" fill="#0A0A0B"/>
    <circle cx="44" cy="38" r="3" fill={color} opacity="0.5"/>
    <circle cx="80" cy="38" r="3" fill={color} opacity="0.5"/>
    <path d="M45 60 Q60 72 75 60" stroke="#0A0A0B" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    <rect x="5" y="30" width="16" height="18" rx="6" fill={color} opacity="0.8"/>
    <rect x="99" y="30" width="16" height="18" rx="6" fill={color} opacity="0.8"/>
  </svg>
);

export default function LandingPage({ config = PRODUCT_CONFIG }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const c = config;

  return (
    <div className="landing-root" style={{ '--accent': c.accentColor, '--accent-dark': c.accentColorDark }}>
      {/* Animated background */}
      <div className="landing-bg">
        <div className="landing-orb landing-orb-1" />
        <div className="landing-orb landing-orb-2" />
        <div className="landing-orb landing-orb-3" />
      </div>

      {/* Header */}
      <header className={`landing-header ${visible ? 'landing-visible' : ''}`}>
        <a href="https://doaide.com" className="landing-brand">
          <RobotFace size={28} color={c.accentColor} />
          <span className="landing-brand-text">
            Do<em>Aide</em> {c.name}
          </span>
        </a>
        <div className="landing-header-actions">
          <a href={c.loginPath} className="landing-btn-ghost">Sign in</a>
          <a href={c.registerPath} className="landing-btn-primary">Get started</a>
        </div>
      </header>

      {/* Hero */}
      <main className={`landing-hero ${visible ? 'landing-visible' : ''}`}>
        <div className="landing-hero-robot-wrap">
          <HeroRobot color={c.accentColor} />
        </div>
        <h1 className="landing-title">{c.tagline}</h1>
        <div className="landing-cta-group">
          <a href={c.registerPath} className="landing-btn-primary landing-btn-lg">Get started free</a>
          <a href={c.loginPath} className="landing-btn-ghost landing-btn-lg">Sign in</a>
        </div>
      </main>

      {/* Features */}
      <section className={`landing-features ${visible ? 'landing-visible' : ''}`}>
        {c.features.map((f, i) => (
          <div
            key={i}
            className="landing-feature-card"
            style={{ animationDelay: `${0.3 + i * 0.1}s` }}
          >
            <span className="landing-feature-icon">{f.icon}</span>
            <span className="landing-feature-title">{f.title}</span>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-products">
          {DOAIDE_PRODUCTS.map((p) => (
            <a key={p.name} href={p.url} className="landing-footer-link">
              {p.name}
            </a>
          ))}
        </div>
        <div className="landing-footer-bottom">
          <a href="https://doaide.com" className="landing-footer-home">
            <RobotFace size={16} color={c.accentColor} />
            doaide.com
          </a>
          <span className="landing-footer-copy">© 2026 DoAide</span>
        </div>
      </footer>
    </div>
  );
}

// Export config template for easy customization
export { PRODUCT_CONFIG, DOAIDE_PRODUCTS, RobotFace, HeroRobot };
