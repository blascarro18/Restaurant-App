import { Routes } from '@angular/router';
import { IngredientsStockComponent } from './ingredients-stock/ingredients-stock.component';
import { MarketHistoryComponent } from './market-history/market-history.component';

export default [
    {
        path: 'ingredients-stock',
        component: IngredientsStockComponent,
    },
    {
        path: 'market-history',
        component: MarketHistoryComponent,
    },
] as Routes;
