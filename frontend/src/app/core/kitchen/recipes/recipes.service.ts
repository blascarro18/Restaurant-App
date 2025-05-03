import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { RecipesData } from './recipe.interface';

@Injectable({
    providedIn: 'root',
})
export class RecipesService {
    private readonly _httpClient = inject(HttpClient);

    getRecipes(): Observable<RecipesData> {
        return this._httpClient.get<RecipesData>(
            `${environment.apiUrl}/kitchen/recipes`
        );
    }
}
