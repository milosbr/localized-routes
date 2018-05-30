import { Pipe, PipeTransform } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { LocalizedRoutesService } from './localized-routes.service';

@Pipe({ name: 'beLocalizeRoute' })
export class LocalizeRoutePipe implements PipeTransform {

  constructor(public localizedRoutes: LocalizedRoutesService) {}

  public transform(path: Array<string> | string, localizeRoute = false): Observable<Array<string>|string> {
    return this.localizedRoutes.translateRoute(path, localizeRoute);
  }
}
