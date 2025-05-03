import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { PaginationRequest } from 'app/core/utils/pagination/pagination.interface';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { PurchasesData } from './market-history.interface';

@Injectable({
    providedIn: 'root',
})
export class MarketHistoryService {
    private readonly _httpClient = inject(HttpClient);

    getMarketHistory(
        paginationData: PaginationRequest
    ): Observable<PurchasesData> {
        return this._httpClient.get<PurchasesData>(
            `${environment.apiUrl}/warehouse/market-history?limit=${paginationData.limit}&page=${paginationData.page}`
        );
    }
}
