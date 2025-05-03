import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Order, OrdersData } from 'app/core/orders/order.interface';
import { PaginationRequest } from 'app/core/utils/pagination/pagination.interface';
import { ToastrService } from 'ngx-toastr';
import { OrdersService } from 'app/core/orders/orders.service';
import { SocketService } from 'app/core/utils/socket.io/socket.io.service';
import { finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'app-kitchen-orders-history',
    standalone: true,
    imports: [
        CommonModule,
        MatProgressBarModule,
        MatIconModule,
        MatButtonModule,
        MatTableModule,
        MatSortModule,
        MatPaginatorModule,
        MatTooltipModule,
    ],
    templateUrl: './kitchen-orders-history.component.html',
    styleUrl: './kitchen-orders-history.component.scss',
})
export class KitchenOrdersHistoryComponent implements OnInit {
    isLoading: boolean = false;
    isMobile: boolean = false;
    refDialog: MatDialogRef<any, any> = null;
    @ViewChild('dialogOrder') dialogOrder: TemplateRef<any>;

    @ViewChild(MatSort) sort: MatSort;
    orders: MatTableDataSource<Order> = new MatTableDataSource<Order>([]);
    selectedOrder: Order;

    displayedColumns: string[] = ['orderNumber', 'recipe', 'status', 'actions'];

    paginationData: PaginationRequest = {
        page: 1,
        limit: 5,
    };

    /**
     * Constructor
     */
    constructor(
        private readonly _dialog: MatDialog,
        private readonly _toastrService: ToastrService,
        private readonly _ordersService: OrdersService,
        private readonly _socketService: SocketService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        this.getOrders(this.paginationData);

        // Conectar el socket
        this._socketService.connect();

        // Escuchar cambios en el estado de una orden
        this._socketService.listenForOrderStatusChanges((data) => {
            //Actualizar la lista de órdenes cuando cambia el estado de una
            this.updateOrderStatus(data);
        });
    }

    getOrders(paginationData: PaginationRequest) {
        this.isLoading = true;
        this._ordersService
            .getOrders(paginationData)
            .pipe(
                finalize(() => {
                    this.isLoading = false;
                })
            )
            .subscribe({
                next: (response: OrdersData) => {
                    this.orders = new MatTableDataSource<Order>(response?.data);
                    this.paginationData.totalItems = response?.meta.total;

                    this.orders.sort = this.sort;
                },
                error: () => {
                    this._toastrService.error(
                        'Ha ocurrido un error, por favor intente mas tarde.'
                    );
                },
            });
    }

    openDialogOrder(order: Order) {
        this.selectedOrder = order;

        this.refDialog = this._dialog.open(this.dialogOrder, {
            width: 'calc(50% - 50px)',
            maxWidth: '100vw',
            disableClose: true,
            autoFocus: false,
        });

        if (this.isMobile) {
            this.refDialog.updateSize('100vw', '100vh');
            this.refDialog.addPanelClass('no-border-radius');
        } else {
            this.refDialog.updateSize('calc(50% - 50px)', '');
            this.refDialog.removePanelClass('no-border-radius');
        }
    }

    closeDialog() {
        this.refDialog.close();
    }

    paginationChange(event: any) {
        this.paginationData.page = event.pageIndex + 1;
        this.paginationData.limit = event.pageSize;
        this.getOrders(this.paginationData);
    }

    updateOrderStatus(data: Order) {
        const index = this.orders.data.findIndex(
            (order) => order.id === data.id
        );

        if (index !== -1) {
            this.orders.data[index].status = data.status;
            this.orders._updateChangeSubscription();
        }
    }
}
