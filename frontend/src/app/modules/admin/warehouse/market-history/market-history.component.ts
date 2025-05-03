import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { PaginationRequest } from 'app/core/utils/pagination/pagination.interface';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import {
    Purchase,
    PurchasesData,
} from 'app/core/warehouse/market/market-history.interface';
import { MarketHistoryService } from 'app/core/warehouse/market/market-history.service';

@Component({
    selector: 'app-market-history',
    standalone: true,
    imports: [
        CommonModule,
        MatProgressBarModule,
        MatTableModule,
        MatSortModule,
        MatPaginatorModule,
    ],
    templateUrl: './market-history.component.html',
    styleUrl: './market-history.component.scss',
})
export class MarketHistoryComponent implements OnInit {
    isLoading: boolean = false;

    @ViewChild(MatSort) sort: MatSort;
    marketHistoryList: MatTableDataSource<Purchase> =
        new MatTableDataSource<Purchase>([]);

    displayedColumns: string[] = [
        'purchaseId',
        'ingredientImage',
        'ingredientName',
        'quantity',
    ];

    paginationData: PaginationRequest = {
        page: 1,
        limit: 5,
    };

    /**
     * Constructor
     */
    constructor(
        private readonly _toastrService: ToastrService,
        private readonly _marketHistoryService: MarketHistoryService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        this.getMarketHistory(this.paginationData);
    }

    getMarketHistory(paginationData: PaginationRequest) {
        this.isLoading = true;
        this._marketHistoryService
            .getMarketHistory(paginationData)
            .pipe(
                finalize(() => {
                    this.isLoading = false;
                })
            )
            .subscribe({
                next: (response: PurchasesData) => {
                    this.marketHistoryList = new MatTableDataSource<Purchase>(
                        response?.data
                    );
                    this.paginationData.totalItems = response?.meta.total;

                    this.marketHistoryList.sort = this.sort;
                },
                error: () => {
                    this._toastrService.error(
                        'Ha ocurrido un error, por favor intente mas tarde.'
                    );
                },
            });
    }

    paginationChange(event: any) {
        this.paginationData.page = event.pageIndex + 1;
        this.paginationData.limit = event.pageSize;
        this.getMarketHistory(this.paginationData);
    }
}
