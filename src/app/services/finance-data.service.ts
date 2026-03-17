import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Transaction {
  id?: string;
  type: 'expense' | 'income';
  amount: number;
  description: string;
  category: string;
  date: Date;
  account?: string;
  merchant?: string;
  notes?: string;
}

export interface Budget {
  name: string;
  spent: number;
  limit: number;
  icon: string;
  color: string;
}

@Injectable({
  providedIn: 'root'
})
export class FinanceDataService {
  private STORAGE_KEY = 'pet_finance_data';
  
  // Use BehaviorSubjects to make data changes reactive
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  transactions$ = this.transactionsSubject.asObservable();
  
  private budgetsSubject = new BehaviorSubject<Budget[]>([]);
  budgets$ = this.budgetsSubject.asObservable();

  constructor() {
    this.loadData();
  }

  // Define predefined budget categories based on your image
  private initialBudgets: Budget[] = [
    { name: 'Groceries', spent: 0, limit: 1500, icon: 'shopping_cart', color: 'orange' },
    { name: 'Rent & Utilities', spent: 0, limit: 2000, icon: 'home', color: 'red' },
    { name: 'Dining Out', spent: 0, limit: 600, icon: 'restaurant', color: 'green' },
    { name: 'Travel', spent: 0, limit: 800, icon: 'flight', color: 'teal' },
    { name: 'Entertainment', spent: 0, limit: 200, icon: 'movie', color: 'deep-orange' }
  ];

  private loadData() {
    const storedData = localStorage.getItem(this.STORAGE_KEY);
    if (storedData) {
      try {
        const { transactions, budgets } = JSON.parse(storedData);
        // Revive Date objects
        const parsedTransactions = transactions.map((t: any) => ({
          ...t,
          date: new Date(t.date)
        }));
        this.transactionsSubject.next(parsedTransactions);
        this.budgetsSubject.next(budgets || this.initialBudgets);
      } catch (e) {
        console.error("Failed to parse stored data", e);
        this.resetToInitial();
      }
    } else {
      this.resetToInitial();
    }
  }

  private resetToInitial() {
    this.transactionsSubject.next([]);
    this.budgetsSubject.next(this.initialBudgets);
    this.saveDataToStorage([], this.initialBudgets);
  }

  private saveDataToStorage(transactions: Transaction[], budgets: Budget[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify({ transactions, budgets }));
  }

  addTransaction(transaction: Transaction) {
    const currentTransactions = this.transactionsSubject.value;
    const newTransaction = { ...transaction, id: Date.now().toString() };
    const updatedTransactions = [newTransaction, ...currentTransactions];
    this.transactionsSubject.next(updatedTransactions);
    this.recalculateBudgets(updatedTransactions);
  }

  deleteTransaction(id: string) {
    const updatedTransactions = this.transactionsSubject.value.filter(t => t.id !== id);
    this.transactionsSubject.next(updatedTransactions);
    this.recalculateBudgets(updatedTransactions);
  }

  getDashboardStats() {
    const transactions = this.transactionsSubject.value;
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const currentMonthTransactions = transactions.filter(t => 
      t.date.getMonth() === currentMonth && t.date.getFullYear() === currentYear
    );

    const totalIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalBalance = totalIncome - totalExpenses;

    // Simulate percentage changes for the key cards
    const balanceChange = 5.2; // Example static values
    const incomeChange = 2.1;
    const expensesChange = -1.5;

    return { totalBalance, totalIncome, totalExpenses, balanceChange, incomeChange, expensesChange };
  }

  // Generate dynamic data for the spending trends chart
  getChartDataForMonth() {
    const transactions = this.transactionsSubject.value;
    const expenses = transactions.filter(t => t.type === 'expense');
    
    const daysInMonth = 30; // Simplify for demonstration
    const dailySpending = new Array(daysInMonth).fill(0);

    expenses.forEach(t => {
      if (t.date.getDate() <= daysInMonth) {
        dailySpending[t.date.getDate() - 1] += t.amount;
      }
    });

    // Create a running total for the area chart
    let runningTotal = 0;
    return dailySpending.map(amount => {
      runningTotal += amount;
      return runningTotal;
    });
  }

  private recalculateBudgets(transactions: Transaction[]) {
    const currentBudgets = this.budgetsSubject.value;
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const expenseCategories = transactions.filter(t => 
      t.type === 'expense' &&
      t.date.getMonth() === currentMonth && 
      t.date.getFullYear() === currentYear
    );

    const updatedBudgets = currentBudgets.map(budget => {
      const spentInCategory = expenseCategories
        .filter(t => t.category.toLowerCase().includes(budget.name.toLowerCase()))
        .reduce((sum, t) => sum + t.amount, 0);
      return { ...budget, spent: spentInCategory };
    });

    this.budgetsSubject.next(updatedBudgets);
    this.saveDataToStorage(transactions, updatedBudgets);
  }
}
