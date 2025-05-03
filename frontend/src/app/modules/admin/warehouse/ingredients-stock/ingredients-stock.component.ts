import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import {
    Ingredient,
    IngredientsData,
} from 'app/core/warehouse/ingredients/ingredient.interface';
import { IngredientsService } from 'app/core/warehouse/ingredients/ingredients.service';

@Component({
    selector: 'app-ingredients-stock',
    standalone: true,
    imports: [
        CommonModule,
        MatProgressBarModule,
        MatTableModule,
        MatSortModule,
    ],
    templateUrl: './ingredients-stock.component.html',
    styleUrl: './ingredients-stock.component.scss',
})
export class IngredientsStockComponent implements OnInit {
    isLoading: boolean = false;

    @ViewChild(MatSort) sort: MatSort;
    ingredients: MatTableDataSource<Ingredient> =
        new MatTableDataSource<Ingredient>([]);

    displayedColumns: string[] = ['image', 'name', 'stock'];

    /**
     * Constructor
     */
    constructor(
        private readonly _toastrService: ToastrService,
        private readonly _ingredientsService: IngredientsService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        this.getIngredients();
    }

    getIngredients() {
        this.isLoading = true;
        this._ingredientsService
            .getIngredients()
            .pipe(
                finalize(() => {
                    this.isLoading = false;
                })
            )
            .subscribe({
                next: (response: IngredientsData) => {
                    this.ingredients = new MatTableDataSource<Ingredient>(
                        response?.data
                    );
                    this.ingredients.sort = this.sort;
                },
                error: () => {
                    this._toastrService.error(
                        'Ha ocurrido un error, por favor intente mas tarde.'
                    );
                },
            });
    }
}
