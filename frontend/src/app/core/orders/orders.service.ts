import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { OrderData, OrdersData } from './order.interface';
import { PaginationRequest } from '../utils/pagination/pagination.interface';

@Injectable({
    providedIn: 'root',
})
export class OrdersService {
    private readonly _httpClient = inject(HttpClient);

    getOrders(paginationData: PaginationRequest): Observable<OrdersData> {
        return this._httpClient.get<OrdersData>(
            `${environment.apiUrl}/orders?limit=${paginationData.limit}&page=${paginationData.page}`
        );
    }

    createNewOrder(): Observable<OrderData> {
        return this._httpClient.post<OrderData>(
            `${environment.apiUrl}/orders/createNewOrder`,
            {}
        );
    }
}
