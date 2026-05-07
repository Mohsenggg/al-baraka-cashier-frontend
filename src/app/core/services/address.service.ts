import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { environment } from '../../shared/environment/developments';
import { GovernorateDto, CityDto } from '../model/interface/address.model';

@Injectable({
      providedIn: 'root'
})
export class AddressService {
      private apiUrl = environment.API_URL;
      private governoratesCache$?: Observable<GovernorateDto[]>;

      constructor(private http: HttpClient) { }

      getGovernorates(): Observable<GovernorateDto[]> {
            if (!this.governoratesCache$) {
                  this.governoratesCache$ = this.http.get<GovernorateDto[]>(`${this.apiUrl}/governorates`).pipe(
                        shareReplay(1)
                  );
            }
            return this.governoratesCache$;
      }

      getCities(governorateId: number): Observable<CityDto[]> {
            return this.http.get<CityDto[]>(`${this.apiUrl}/governorates/${governorateId}/cities`);
      }
}
