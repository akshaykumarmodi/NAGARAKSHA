// Time and deadline utilities for CivicFix AI

export function formatDateTime(isoString) {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return isoString;
  }
}

export function formatRelativeTime(isoString) {
  if (!isoString) return 'N/A';
  const now = new Date();
  const past = new Date(isoString);
  const diffMs = now - past;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

export function calculateDeadline(createdAtIso, slaHours = 48) {
  const created = new Date(createdAtIso || Date.now());
  const deadline = new Date(created.getTime() + slaHours * 60 * 60 * 1000);
  return deadline.toISOString();
}

export function getDeadlineStatus(deadlineIso, currentStatus) {
  if (['Resolved'].includes(currentStatus)) {
    return {
      isOverdue: false,
      label: 'Completed within SLA',
      tone: 'success',
      badgeClass: 'badge-success'
    };
  }

  if (!deadlineIso) {
    return {
      isOverdue: false,
      label: 'No deadline set',
      tone: 'neutral',
      badgeClass: 'badge-neutral'
    };
  }

  const now = new Date();
  const deadline = new Date(deadlineIso);
  const diffMs = deadline - now;
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (diffMs < 0) {
    const overdueHours = Math.abs(diffHours);
    const overdueDays = Math.floor(overdueHours / 24);
    const text = overdueDays > 0 ? `${overdueDays}d ${overdueHours % 24}h overdue` : `${overdueHours}h overdue`;
    return {
      isOverdue: true,
      remainingHours: diffHours,
      label: text,
      tone: 'critical',
      badgeClass: 'badge-danger'
    };
  }

  if (diffHours <= 6) {
    return {
      isOverdue: false,
      remainingHours: diffHours,
      label: `${diffHours}h left (Urgent)`,
      tone: 'warning',
      badgeClass: 'badge-warning'
    };
  }

  const days = Math.floor(diffHours / 24);
  const remainingText = days > 0 ? `${days}d ${diffHours % 24}h remaining` : `${diffHours}h remaining`;
  return {
    isOverdue: false,
    remainingHours: diffHours,
    label: remainingText,
    tone: 'safe',
    badgeClass: 'badge-info'
  };
}

// Generate dynamic timestamps relative to current moment
export function hoursAgo(h) {
  return new Date(Date.now() - h * 3600 * 1000).toISOString();
}

export function hoursFromNow(h) {
  return new Date(Date.now() + h * 3600 * 1000).toISOString();
}
