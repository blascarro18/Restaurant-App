import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Order, OrderData, OrdersData } from 'app/core/orders/order.interface';
import { ToastrService } from 'ngx-toastr';
import { OrdersService } from 'app/core/orders/orders.service';
import { finalize } from 'rxjs';
import { MatPaginatorModule } from '@angular/material/paginator';
import { PaginationRequest } from 'app/core/utils/pagination/pagination.interface';
import { SocketService } from 'app/core/utils/socket.io/socket.io.service';

@Component({
    selector: 'app-orders',
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
    templateUrl: './orders.component.html',
    styleUrl: './orders.component.scss',
})
export class OrdersComponent implements OnInit {
    isLoading: boolean = false;
    isMobile: boolean = false;
    refDialog: MatDialogRef<any, any> = null;
    @ViewChild('dialogNewOrderCreated') dialogNewOrderCreated: TemplateRef<any>;
    @ViewChild('dialogOrder') dialogOrder: TemplateRef<any>;

    @ViewChild(MatSort) sort: MatSort;
    orders: MatTableDataSource<Order> = new MatTableDataSource<Order>([]);
    newOrderCreated: Order;
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

    createNewOrder() {
        this.isLoading = true;

        this._ordersService
            .createNewOrder()
            .pipe(
                finalize(() => {
                    this.isLoading = false;
                })
            )
            .subscribe({
                next: (response: OrderData) => {
                    //Agregar la nueva orden a la lista de órdenes
                    this.orders.data.unshift(response?.data);
                    this.orders._updateChangeSubscription();
                    this.paginationData.totalItems += 1;

                    this.openDialogNewOrderCreated(response?.data);
                },
                error: () => {
                    this._toastrService.error(
                        'Ha ocurrido un error, por favor intente mas tarde.'
                    );
                },
            });
    }

    openDialogNewOrderCreated(orderCreated: Order) {
        this.newOrderCreated = orderCreated;

        this.refDialog = this._dialog.open(this.dialogNewOrderCreated, {
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
