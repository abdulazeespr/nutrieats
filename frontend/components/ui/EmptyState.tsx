import { ReactNode } from "react";

interface EmptyStateProps {
  emoji: string;
  heading: string;
  subtext?: string;
  action?: ReactNode;
  /** Optional extra class names on the outer wrapper */
  className?: string;
}

/**
 * Reusable empty-state block.
 *
 * Usage:
 *   <EmptyState
 *     emoji="🛒"
 *     heading="Your cart is empty"
 *     subtext="Browse restaurants and add items to get started."
 *     action={<Link href="/restaurants"><Button>Browse restaurants</Button></Link>}
 *   />
 */
export default function EmptyState({
  emoji,
  heading,
  subtext,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-20 px-4 ${className}`}
      role="status"
      aria-label={heading}
    >
      <span className="text-5xl mb-4 select-none" aria-hidden="true">
        {emoji}
      </span>
      <p className="text-lg font-semibold text-gray-700">{heading}</p>
      {subtext && (
        <p className="text-sm text-gray-500 mt-1 max-w-xs">{subtext}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
