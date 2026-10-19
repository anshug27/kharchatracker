// AI-style spending insights engine (runs locally, no API needed)
import type { Expense, Budget } from './storage';

export interface Insight {
  id: string;
  type: 'warning' | 'tip' | 'achievement' | 'trend' | 'suggestion';
  icon: string;
  title: string;
  description: string;
  category?: string;
  actionLabel?: string;
  actionUrl?: string;
  priority: number; // 1-5, higher = more important
}

export function generateInsights(
  expenses: Expense[],
  budgets: Budget[],
  monthlyIncome: number
): Insight[] {
  const insights: Insight[] = [];
  const now = new Date();
  const thisMonth = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && e.type === 'expense';
  });
  const lastMonth = expenses.filter(e => {
    const d = new Date(e.date);
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear() && e.type === 'expense';
  });

  const thisMonthTotal = thisMonth.reduce((s, e) => s + e.amount, 0);
  const lastMonthTotal = lastMonth.reduce((s, e) => s + e.amount, 0);

  // Category totals this month
  const catTotals: Record<string, number> = {};
  thisMonth.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });

  const lastCatTotals: Record<string, number> = {};
  lastMonth.forEach(e => { lastCatTotals[e.category] = (lastCatTotals[e.category] || 0) + e.amount; });

  // 1. Month-over-month spending change
  if (lastMonthTotal > 0) {
    const change = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
    if (change > 20) {
      insights.push({
        id: 'mom-increase',
        type: 'warning',
        icon: '📈',
        title: 'Spending Up This Month',
        description: `You've spent ${Math.round(change)}% more this month compared to last month. Consider reviewing your recent purchases.`,
        priority: 4,
      });
    } else if (change < -10) {
      insights.push({
        id: 'mom-decrease',
        type: 'achievement',
        icon: '🎉',
        title: 'Great Job Saving!',
        description: `You've spent ${Math.abs(Math.round(change))}% less this month compared to last month. Keep it up!`,
        priority: 3,
      });
    }
  }

  // 2. Budget alerts
  budgets.forEach(budget => {
    const spent = catTotals[budget.category] || 0;
    const pct = (spent / budget.limit) * 100;
    if (pct >= 100) {
      insights.push({
        id: `budget-exceeded-${budget.category}`,
        type: 'warning',
        icon: '🚨',
        title: `${budget.category} Budget Exceeded!`,
        description: `You've spent ${Math.round(pct)}% of your ${budget.category} budget. Time to cut back.`,
        category: budget.category,
        priority: 5,
      });
    } else if (pct >= 80) {
      insights.push({
        id: `budget-warning-${budget.category}`,
        type: 'warning',
        icon: '⚠️',
        title: `${budget.category} Budget Almost Done`,
        description: `${Math.round(pct)}% of your ${budget.category} budget is used. ${Math.round(budget.limit - spent)} remaining.`,
        category: budget.category,
        priority: 4,
      });
    }
  });

  // 3. Top spending category
  const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  if (sortedCats.length > 0) {
    const [topCat, topAmt] = sortedCats[0];
    const pctOfTotal = thisMonthTotal > 0 ? Math.round((topAmt / thisMonthTotal) * 100) : 0;
    insights.push({
      id: 'top-category',
      type: 'trend',
      icon: '🔍',
      title: `${topCat} is Your Top Spend`,
      description: `${topCat} accounts for ${pctOfTotal}% of your spending this month. Look for ways to optimize.`,
      category: topCat,
      priority: 3,
      actionLabel: 'Search for better deals',
      actionUrl: `/deals?category=${encodeURIComponent(topCat)}`,
    });
  }

  // 4. Category spike detection
  Object.entries(catTotals).forEach(([cat, total]) => {
    const lastTotal = lastCatTotals[cat] || 0;
    if (lastTotal > 0 && total > lastTotal * 1.5 && total > 500) {
      insights.push({
        id: `spike-${cat}`,
        type: 'warning',
        icon: '⚡',
        title: `${cat} Spending Spiked`,
        description: `${cat} spending jumped ${Math.round(((total - lastTotal) / lastTotal) * 100)}% vs last month.`,
        category: cat,
        priority: 4,
      });
    }
  });

  // 5. Income vs expense ratio
  if (monthlyIncome > 0) {
    const ratio = (thisMonthTotal / monthlyIncome) * 100;
    if (ratio > 90) {
      insights.push({
        id: 'income-ratio-danger',
        type: 'warning',
        icon: '💸',
        title: 'Spending Nearly All Income',
        description: `You've spent ${Math.round(ratio)}% of your monthly income. Try to save at least 20% each month.`,
        priority: 5,
      });
    } else if (ratio < 50) {
      insights.push({
        id: 'income-ratio-good',
        type: 'achievement',
        icon: '💰',
        title: 'Excellent Savings Rate!',
        description: `You've only used ${Math.round(ratio)}% of your income. You're saving ${Math.round(100 - ratio)}% — amazing!`,
        priority: 2,
      });
    }
  }

  // 6. Subscription tracking
  const subscriptions = thisMonth.filter(e => e.isRecurring || e.category === 'Subscriptions');
  if (subscriptions.length > 0) {
    const subTotal = subscriptions.reduce((s, e) => s + e.amount, 0);
    insights.push({
      id: 'subscriptions',
      type: 'tip',
      icon: '📱',
      title: `${subscriptions.length} Active Subscriptions`,
      description: `You're spending ₹${subTotal.toLocaleString('en-IN')} on subscriptions. Review if all are needed.`,
      priority: 3,
      actionLabel: 'Find cheaper alternatives',
      actionUrl: '/deals?category=Subscriptions',
    });
  }

  // 7. Weekend vs weekday spending
  const weekendExpenses = thisMonth.filter(e => {
    const day = new Date(e.date).getDay();
    return day === 0 || day === 6;
  });
  const weekendTotal = weekendExpenses.reduce((s, e) => s + e.amount, 0);
  const weekdayTotal = thisMonthTotal - weekendTotal;
  if (weekendTotal > weekdayTotal * 0.6 && thisMonth.length > 5) {
    insights.push({
      id: 'weekend-spending',
      type: 'tip',
      icon: '🎉',
      title: 'High Weekend Spending',
      description: `You spend a lot on weekends. Try planning free activities to save more.`,
      priority: 3,
    });
  }

  // 8. No expense days streak
  const today = now.getDate();
  let streak = 0;
  for (let i = today - 1; i >= 1; i--) {
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const hasExpense = thisMonth.some(e => e.date.startsWith(dateStr));
    if (!hasExpense) streak++;
    else break;
  }
  if (streak >= 3) {
    insights.push({
      id: 'no-spend-streak',
      type: 'achievement',
      icon: '🔥',
      title: `${streak}-Day No-Spend Streak!`,
      description: `You haven't logged expenses for ${streak} days. If intentional, great self-control!`,
      priority: 2,
    });
  }

  // 9. Small purchases adding up
  const smallPurchases = thisMonth.filter(e => e.amount < 100);
  const smallTotal = smallPurchases.reduce((s, e) => s + e.amount, 0);
  if (smallPurchases.length > 15 && smallTotal > 1000) {
    insights.push({
      id: 'small-purchases',
      type: 'tip',
      icon: '🪙',
      title: 'Small Purchases Add Up',
      description: `${smallPurchases.length} purchases under ₹100 total ₹${smallTotal.toLocaleString('en-IN')}. The "latte factor" is real!`,
      priority: 3,
    });
  }

  // 10. Saving suggestion based on top category
  if (sortedCats.length > 0) {
    const [topCat] = sortedCats[0];
    const dealSuggestions: Record<string, string> = {
      'Food & Dining': 'Try meal prepping on Sundays — can save 30-40% on food costs',
      'Transport': 'Consider carpooling or monthly passes to reduce transport costs',
      'Shopping': 'Try the 48-hour rule: wait 2 days before any non-essential purchase',
      'Entertainment': 'Look for free events, library memberships, and student discounts',
      'Subscriptions': 'Audit your subscriptions — cancel unused ones and look for family plans',
      'Bills & Utilities': 'Compare electricity and internet plans for better rates',
    };
    if (dealSuggestions[topCat]) {
      insights.push({
        id: 'saving-tip',
        type: 'suggestion',
        icon: '💡',
        title: 'Money-Saving Tip',
        description: dealSuggestions[topCat],
        category: topCat,
        priority: 2,
      });
    }
  }

  return insights.sort((a, b) => b.priority - a.priority);
}

// Generate a spending score (0-100)
export function getSpendingScore(
  expenses: Expense[],
  budgets: Budget[],
  monthlyIncome: number
): { score: number; label: string; color: string } {
  const now = new Date();
  const thisMonth = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && e.type === 'expense';
  });
  const total = thisMonth.reduce((s, e) => s + e.amount, 0);

  let score = 70; // base

  // Income ratio (if set)
  if (monthlyIncome > 0) {
    const ratio = total / monthlyIncome;
    if (ratio < 0.5) score += 20;
    else if (ratio < 0.7) score += 10;
    else if (ratio > 0.9) score -= 20;
    else if (ratio > 0.8) score -= 10;
  }

  // Budget adherence
  let budgetPenalty = 0;
  budgets.forEach(b => {
    const catTotal = thisMonth.filter(e => e.category === b.category).reduce((s, e) => s + e.amount, 0);
    if (catTotal > b.limit) budgetPenalty += 5;
    else if (catTotal < b.limit * 0.8) score += 2;
  });
  score -= budgetPenalty;

  // Diversity bonus (not spending all in one category)
  const cats = new Set(thisMonth.map(e => e.category));
  if (cats.size >= 3) score += 5;

  score = Math.max(0, Math.min(100, score));

  let label = 'Excellent';
  let color = '#10b981';
  if (score < 40) { label = 'Needs Work'; color = '#ef4444'; }
  else if (score < 60) { label = 'Fair'; color = '#f59e0b'; }
  else if (score < 80) { label = 'Good'; color = '#3b82f6'; }

  return { score, label, color };
}
