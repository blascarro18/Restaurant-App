/* eslint-disable */
import { FuseNavigationItem } from '@fuse/components/navigation';

export const defaultNavigation: FuseNavigationItem[] = [];

export const compactNavigation: FuseNavigationItem[] = [
    {
        id: 'orders',
        title: 'Ordenes',
        tooltip: 'Ordenes',
        type: 'basic',
        icon: 'mat_outline:receipt_long',
        link: '/orders-management',
    },
    {
        id: 'kitchen',
        title: 'Cocina',
        tooltip: 'Cocina',
        type: 'aside',
        icon: 'mat_outline:kitchen',
        children: [
            {
                id: 'kitchen-orders',
                title: 'Ordenes',
                type: 'basic',
                icon: 'mat_outline:receipt_long',
                link: '/kitchen/orders',
            },
            {
                id: 'kitchen-recipes',
                title: 'Recetas',
                type: 'basic',
                icon: 'mat_outline:book',
                link: '/kitchen/recipes',
            },
        ],
    },
    {
        id: 'warehouse',
        title: 'Bodega',
        tooltip: 'Bodega',
        type: 'aside',
        icon: 'mat_outline:inventory_2',
        children: [
            {
                id: 'warehouse-ingredients-stock',
                title: 'Inventario',
                type: 'basic',
                icon: 'mat_outline:inventory',
                link: '/warehouse/ingredients-stock',
            },
            {
                id: 'warehouse-market-history',
                title: 'Historial de Plaza de mercado',
                type: 'basic',
                icon: 'mat_outline:history',
                link: '/warehouse/market-history',
            },
        ],
    },
];
