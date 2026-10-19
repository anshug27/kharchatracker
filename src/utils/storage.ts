// Local storage utility for expense data

export interface Expense {
  id: string;
  amount: number;
  category: string;
  subcategory?: string;
  description: string;
  date: string; // ISO string
  type: 'expense' | 'income';
  isRecurring?: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  tags?: string[];
  paymentMethod?: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  period: 'weekly' | 'monthly' | 'yearly';
  createdAt: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'no-spend' | 'save-target' | 'reduce-category' | 'custom';
  targetAmount?: number;
  category?: string;
  startDate: string;
  endDate: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  icon?: string;
  createdAt: string;
}

export interface UserSettings {
  currency: string;
  currencySymbol: string;
  darkMode: boolean;
  categories: CategoryConfig[];
  paymentMethods: string[];
  monthlyIncome?: number;
}

export interface CategoryConfig {
  name: string;
  icon: string;
  color: string;
  subcategories?: string[];
}

const STORAGE_KEYS = {
  EXPENSES: 'kt_expenses',
  BUDGETS: 'kt_budgets',
  CHALLENGES: 'kt_challenges',
  GOALS: 'kt_goals',
  SETTINGS: 'kt_settings',
} as const;

const DEFAULT_CATEGORIES: CategoryConfig[] = [
  { name: 'Food & Dining', icon: '🍔', color: '#f59e0b', subcategories: ['Groceries', 'Restaurants', 'Cafe', 'Street Food', 'Delivery'] },
  { name: 'Transport', icon: '🚗', color: '#3b82f6', subcategories: ['Fuel', 'Auto/Cab', 'Metro/Bus', 'Parking', 'Maintenance'] },
  { name: 'Shopping', icon: '🛍️', color: '#ec4899', subcategories: ['Clothes', 'Electronics', 'Home', 'Gifts', 'Online'] },
  { name: 'Bills & Utilities', icon: '💡', color: '#8b5cf6', subcategories: ['Electricity', 'Water', 'Gas', 'Internet', 'Phone'] },
  { name: 'Entertainment', icon: '🎬', color: '#ef4444', subcategories: ['Movies', 'Streaming', 'Games', 'Events', 'Hobbies'] },
  { name: 'Health', icon: '🏥', color: '#10b981', subcategories: ['Medicine', 'Doctor', 'Gym', 'Insurance'] },
  { name: 'Education', icon: '📚', color: '#6366f1', subcategories: ['Courses', 'Books', 'Tuition', 'Supplies'] },
  { name: 'Rent & Housing', icon: '🏠', color: '#f97316', subcategories: ['Rent', 'Maintenance', 'Furniture', 'Cleaning'] },
  { name: 'Subscriptions', icon: '📱', color: '#14b8a6', subcategories: ['Netflix', 'Spotify', 'Apps', 'Newspapers'] },
  { name: 'Personal Care', icon: '💆', color: '#d946ef', subcategories: ['Salon', 'Skincare', 'Grooming'] },
  { name: 'Investments', icon: '📈', color: '#059669', subcategories: ['SIP', 'Stocks', 'FD', 'Gold', 'Crypto'] },
  { name: 'Other', icon: '📌', color: '#64748b', subcategories: ['Miscellaneous'] },
];

const DEFAULT_PAYMENT_METHODS = ['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet'];

const DEFAULT_SETTINGS: UserSettings = {
  currency: 'INR',
  currencySymbol: '₹',
  darkMode: false,
  categories: DEFAULT_CATEGORIES,
  paymentMethods: DEFAULT_PAYMENT_METHODS,
  monthlyIncome: 0,
};

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage error:', e);
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Expenses
export function getExpenses(): Expense[] {
  return getItem<Expense[]>(STORAGE_KEYS.EXPENSES, []);
}

export function addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Expense {
  const expenses = getExpenses();
  const newExpense: Expense = { ...expense, id: generateId(), createdAt: new Date().toISOString() };
  expenses.push(newExpense);
  setItem(STORAGE_KEYS.EXPENSES, expenses);
  return newExpense;
}

export function updateExpense(id: string, updates: Partial<Expense>): void {
  const expenses = getExpenses();
  const idx = expenses.findIndex(e => e.id === id);
  if (idx !== -1) {
    expenses[idx] = { ...expenses[idx], ...updates };
    setItem(STORAGE_KEYS.EXPENSES, expenses);
  }
}

export function deleteExpense(id: string): void {
  const expenses = getExpenses().filter(e => e.id !== id);
  setItem(STORAGE_KEYS.EXPENSES, expenses);
}

// Budgets
export function getBudgets(): Budget[] {
  return getItem<Budget[]>(STORAGE_KEYS.BUDGETS, []);
}

export function addBudget(budget: Omit<Budget, 'id' | 'createdAt'>): Budget {
  const budgets = getBudgets();
  const newBudget: Budget = { ...budget, id: generateId(), createdAt: new Date().toISOString() };
  budgets.push(newBudget);
  setItem(STORAGE_KEYS.BUDGETS, budgets);
  return newBudget;
}

export function deleteBudget(id: string): void {
  const budgets = getBudgets().filter(b => b.id !== id);
  setItem(STORAGE_KEYS.BUDGETS, budgets);
}

// Challenges
export function getChallenges(): Challenge[] {
  return getItem<Challenge[]>(STORAGE_KEYS.CHALLENGES, []);
}

export function addChallenge(challenge: Omit<Challenge, 'id' | 'createdAt'>): Challenge {
  const challenges = getChallenges();
  const newChallenge: Challenge = { ...challenge, id: generateId(), createdAt: new Date().toISOString() };
  challenges.push(newChallenge);
  setItem(STORAGE_KEYS.CHALLENGES, challenges);
  return newChallenge;
}

export function updateChallenge(id: string, updates: Partial<Challenge>): void {
  const challenges = getChallenges();
  const idx = challenges.findIndex(c => c.id === id);
  if (idx !== -1) {
    challenges[idx] = { ...challenges[idx], ...updates };
    setItem(STORAGE_KEYS.CHALLENGES, challenges);
  }
}

export function deleteChallenge(id: string): void {
  const challenges = getChallenges().filter(c => c.id !== id);
  setItem(STORAGE_KEYS.CHALLENGES, challenges);
}

// Savings Goals
export function getGoals(): SavingsGoal[] {
  return getItem<SavingsGoal[]>(STORAGE_KEYS.GOALS, []);
}

export function addGoal(goal: Omit<SavingsGoal, 'id' | 'createdAt'>): SavingsGoal {
  const goals = getGoals();
  const newGoal: SavingsGoal = { ...goal, id: generateId(), createdAt: new Date().toISOString() };
  goals.push(newGoal);
  setItem(STORAGE_KEYS.GOALS, goals);
  return newGoal;
}

export function updateGoal(id: string, updates: Partial<SavingsGoal>): void {
  const goals = getGoals();
  const idx = goals.findIndex(g => g.id === id);
  if (idx !== -1) {
    goals[idx] = { ...goals[idx], ...updates };
    setItem(STORAGE_KEYS.GOALS, goals);
  }
}

export function deleteGoal(id: string): void {
  const goals = getGoals().filter(g => g.id !== id);
  setItem(STORAGE_KEYS.GOALS, goals);
}

// Settings
export function getSettings(): UserSettings {
  return getItem<UserSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export function updateSettings(updates: Partial<UserSettings>): void {
  const settings = getSettings();
  setItem(STORAGE_KEYS.SETTINGS, { ...settings, ...updates });
}

// Analytics helpers
export function getExpensesByDateRange(start: Date, end: Date): Expense[] {
  return getExpenses().filter(e => {
    const d = new Date(e.date);
    return d >= start && d <= end && e.type === 'expense';
  });
}

export function getIncomeByDateRange(start: Date, end: Date): Expense[] {
  return getExpenses().filter(e => {
    const d = new Date(e.date);
    return d >= start && d <= end && e.type === 'income';
  });
}

export function getCategoryTotals(expenses: Expense[]): Record<string, number> {
  return expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);
}

export function getDailyTotals(expenses: Expense[]): Record<string, number> {
  return expenses.reduce((acc, e) => {
    const day = e.date.split('T')[0];
    acc[day] = (acc[day] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);
}

export function getMonthlyTotal(year: number, month: number): number {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);
  return getExpensesByDateRange(start, end).reduce((sum, e) => sum + e.amount, 0);
}

export function formatCurrency(amount: number): string {
  const settings = getSettings();
  return `${settings.currencySymbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// Export data for backup
export function exportData(): string {
  return JSON.stringify({
    expenses: getExpenses(),
    budgets: getBudgets(),
    challenges: getChallenges(),
    goals: getGoals(),
    settings: getSettings(),
    exportedAt: new Date().toISOString(),
  }, null, 2);
}

// Import data from backup
export function importData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (data.expenses) setItem(STORAGE_KEYS.EXPENSES, data.expenses);
    if (data.budgets) setItem(STORAGE_KEYS.BUDGETS, data.budgets);
    if (data.challenges) setItem(STORAGE_KEYS.CHALLENGES, data.challenges);
    if (data.goals) setItem(STORAGE_KEYS.GOALS, data.goals);
    if (data.settings) setItem(STORAGE_KEYS.SETTINGS, data.settings);
    return true;
  } catch {
    return false;
  }
}
