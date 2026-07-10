import "./LoginAnimatedBackground.css";

export default function LoginAnimatedBackground() {
  return (
    <div className="login-animated-bg" aria-hidden="true">
      <div className="login-bg-glow login-bg-glow-left" />
      <div className="login-bg-glow login-bg-glow-right" />
      <div className="login-bg-stars" />
      <div className="login-bg-wave login-bg-wave-primary" />
      <div className="login-bg-wave login-bg-wave-secondary" />

      <div className="login-bg-panel login-bg-panel-1" />
      <div className="login-bg-panel login-bg-panel-2" />
      <div className="login-bg-panel login-bg-panel-3" />

      <svg className="login-bg-network" viewBox="0 0 1600 900" preserveAspectRatio="none">
        <path className="login-network-line" d="M40 140 L250 78 L370 178 L520 32" />
        <path className="login-network-line" d="M980 72 L1120 138 L1345 70 L1520 188" />
        <path className="login-network-line login-network-line-soft" d="M1180 342 L1330 238 L1450 344" />
        <circle className="login-network-node" cx="250" cy="78" r="5" />
        <circle className="login-network-node" cx="370" cy="178" r="7" />
        <circle className="login-network-node" cx="1120" cy="138" r="6" />
        <circle className="login-network-node" cx="1345" cy="70" r="6" />
        <circle className="login-network-node login-network-node-large" cx="1520" cy="188" r="9" />
      </svg>

      <svg className="login-bg-lines" viewBox="0 0 1600 900" preserveAspectRatio="none">
        <path
          className="login-flow-line login-flow-line-1"
          d="M-120 760 C 260 620, 520 850, 820 720 S 1250 610, 1720 760"
        />
        <path
          className="login-flow-line login-flow-line-2"
          d="M-160 820 C 240 690, 560 900, 900 760 S 1280 680, 1760 830"
        />
        <path
          className="login-flow-line login-flow-line-3"
          d="M-100 700 C 260 580, 560 720, 850 650 S 1280 560, 1700 690"
        />

        <circle className="login-node login-node-1" cx="240" cy="690" r="4" />
        <circle className="login-node login-node-2" cx="520" cy="760" r="3" />
        <circle className="login-node login-node-3" cx="1130" cy="650" r="4" />
        <circle className="login-node login-node-4" cx="1360" cy="720" r="3" />
      </svg>

      <div className="login-bg-sweep" />
    </div>
  );
}
