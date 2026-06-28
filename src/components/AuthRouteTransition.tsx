interface AuthRouteTransitionProps {
  active: boolean;
}

export default function AuthRouteTransition({ active }: AuthRouteTransitionProps) {
  if (!active) return null;

  return (
    <div className="auth-route-transition" role="status" aria-live="polite" aria-label="页面切换中">
      <span className="auth-route-spinner" />
    </div>
  );
}
