import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { Recipe, RecipesData } from 'app/core/kitchen/recipes/recipe.interface';
import { RecipesService } from 'app/core/kitchen/recipes/recipes.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-recipes',
    standalone: true,
    imports: [
        CommonModule,
        MatProgressBarModule,
        MatIconModule,
        MatButtonModule,
        MatTableModule,
        MatSortModule,
        MatTooltipModule,
    ],
    templateUrl: './recipes.component.html',
    styleUrl: './recipes.component.scss',
})
export class RecipesComponent implements OnInit {
    isLoading: boolean = false;
    isMobile: boolean = false;
    refDialog: MatDialogRef<any, any> = null;
    @ViewChild('dialogRecipe') dialogRecipe: TemplateRef<any>;

    @ViewChild(MatSort) sort: MatSort;
    recipes: MatTableDataSource<Recipe> = new MatTableDataSource<Recipe>([]);
    selectedRecipe: Recipe;

    displayedColumns: string[] = ['image', 'name', 'description', 'actions'];

    /**
     * Constructor
     */
    constructor(
        private readonly _dialog: MatDialog,
        private readonly _toastrService: ToastrService,
        private readonly _recipesService: RecipesService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        this.getRecipes();
    }

    getRecipes() {
        this.isLoading = true;
        this._recipesService
            .getRecipes()
            .pipe(
                finalize(() => {
                    this.isLoading = false;
                })
            )
            .subscribe({
                next: (response: RecipesData) => {
                    this.recipes = new MatTableDataSource<Recipe>(
                        response?.data
                    );
                    this.recipes.sort = this.sort;
                },
                error: () => {
                    this._toastrService.error(
                        'Ha ocurrido un error, por favor intente mas tarde.'
                    );
                },
            });
    }

    openDialogRecipe(recipe: Recipe) {
        this.selectedRecipe = recipe;

        this.refDialog = this._dialog.open(this.dialogRecipe, {
            width: 'calc(50% - 50px)',
            maxWidth: '100vw',
            disableClose: true,
            autoFocus: false,
        });

        this.refDialog.afterClosed().subscribe(() => {
            this.selectedRecipe = null;
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
}
