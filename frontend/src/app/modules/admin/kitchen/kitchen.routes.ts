import { Routes } from '@angular/router';
import { OrdersComponent } from '../orders/orders.component';
import { RecipesComponent } from './recipes/recipes.component';
import { KitchenOrdersHistoryComponent } from './kitchen-orders-history/kitchen-orders-history.component';
export default [
    {
        path: 'orders',
        component: KitchenOrdersHistoryComponent,
    },
    {
        path: 'recipes',
        component: RecipesComponent,
    },
] as Routes;
