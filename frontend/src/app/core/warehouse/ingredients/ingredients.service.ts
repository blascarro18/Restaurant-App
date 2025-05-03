import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { IngredientsData } from './ingredient.interface';

@Injectable({
    providedIn: 'root',
})
export class IngredientsService {
    private readonly _httpClient = inject(HttpClient);

    getIngredients(): Observable<IngredientsData> {
        return this._httpClient.get<IngredientsData>(
            `${environment.apiUrl}/warehouse/ingredients`
        );
    }
}
