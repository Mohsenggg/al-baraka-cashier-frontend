import { Routes } from '@angular/router';



export const routes: Routes = [

      { path: '', redirectTo: 'pos/login', pathMatch: 'full' },
      { path: 'pos/login', loadComponent: () => import('./features/pos/login/login.component').then(c => c.LoginComponent) },
      { path: 'pos/cashier', loadComponent: () => import('./features/pos/cashier/cashier-page.component').then(c => c.CashierPageComponent) },
      { path: 'pos/receipts', loadComponent: () => import('./features/pos/receipts/receipt-list.component').then(c => c.ReceiptListComponent) },
      { path: 'pos/receipt-form', loadComponent: () => import('./features/pos/receipts/receipt-form.component').then(c => c.ReceiptFormComponent) },
      { path: 'pos/products', loadComponent: () => import('./features/pos/products/components/products-main-page/products-main-page.component').then(c => c.ProductsMainPageComponent) },
];
