import { Injectable, Inject } from '@angular/core';
import { Location } from '@angular/common';
import { ROUTES, Router, Route, Routes, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { LocalizedRoutesSettings } from './localized-routes.settings';
import { LocalizedRoutesParser } from './localized-routes.parser';
import { StorageService } from '../services/storage/storage.service';

type pathType = Array<string> | string;

@Injectable()
export class LocalizedRoutesService {

  public currentLangSubject: BehaviorSubject<string>;
  public dynamicRoutesSubject: BehaviorSubject<Routes>;

  private currentLang: string;
  private dynamicRoutes: Routes = [];
  private originalRoutes: Routes;
  private translations;
  private localeIds: Array<string>;
  private initialNavigation: boolean = true;

  public constructor(
    @Inject(ROUTES) private initialRoutes,
    private activeRoute: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private location: Location,
    private settings: LocalizedRoutesSettings,
    private parser: LocalizedRoutesParser,
    private storage: StorageService
    ) {}

  // execute with module constructor
  public init(): void {
    // prevent calling this method more than once
    if (!this.initialNavigation) { return; }
    // set initial values
    this.originalRoutes = this.initialRoutes[0];
    this.localeIds = this.settings.langs;
    this.translations = this.settings.translations;
    // prepare initial routes config and reset router
    this.updateDynamicRoutes();

    // settings for translate service
    this.translate.addLangs(this.localeIds);
    this.translate.setDefaultLang(this.settings.defaultLang);


    // get lang from url - if any
    const initialUrl = (this.location.path()) ? this.location.path() : '/';
    const initialUrlArray = initialUrl.split('/');

    // if lang in url - add translated routes
    if (initialUrlArray[1] && this.localeIds.indexOf(initialUrlArray[1]) !== -1) {
      // update lang from URL
      this.updateLang(initialUrlArray[1]);
      this.localizeRoutes();
      // init translate service with lang from URL
      this.translate.use(this.currentLang);
      // TODO: check localStorage for lang. if existing, use and localize

    // if lang not in url
    } else {
      // init translate service with default lang
      this.translate.use(this.settings.defaultLang);
      // get lang from localStorage
      this.storage.get('localizeRoutes/lang')
      .then(storedLang => {
        const defaultLang = storedLang ? storedLang : this.settings.defaultLang;
        this.updateLang(defaultLang);
        // update translate service language after check from localStorage
        this.translate.use(this.currentLang);
      });
    }

    // localize routes on langChange
    this.translate.onLangChange.subscribe(({lang}) => {
      this.updateLang(lang);
      this.localizeRoutes();
      // only for the first time
      if (this.initialNavigation) {
        // TODO: if user uses other lang than in url, translate url to users lang and redirect
        this.initialNavigation = false;
        // if no lang stored, store it
        this.storage.get('localizeRoutes/lang')
        .then(storedLang => {
          if (!storedLang) { this.storage.put('localizeRoutes/lang', lang); }
        });
        return;
      }
      // save changed Lang to localStorage
      this.storage.put('localizeRoutes/lang', lang);
      // navigate to translated url
      this.router.navigateByUrl(
        <string>this.parser.translatePathFromString(this.location.path(),
        this.currentLang,
        this.activeRoute)
      );
    });
  }

  // public method used by localizeRoutePipe. returns Observable that emits translated/localized route
  public translateRoute(path: pathType, localizeRoute = false): Observable<pathType> {
    const pathTranslation = new BehaviorSubject(this.parser.translatePath(path, this.currentLang, localizeRoute));
    this.translate.onLangChange.subscribe(({lang}) => {
      this.updateLang(lang);
      pathTranslation.next(this.parser.translatePath(path, this.currentLang, localizeRoute));
    });
    return pathTranslation.asObservable();
  }

  // on lang change, localize root route tree
  private localizeRoutes(): void {
    // check if routes for lang exists
    const translatedRouteIndex = this.dynamicRoutes.findIndex(route => {
      return (route.path === this.currentLang);
    });
    // check if default lang
    const isDefaultLang = this.currentLang === this.settings.defaultLang;
    if (isDefaultLang || translatedRouteIndex !== -1) { return; }
    this.updateDynamicRoutes(this.addTranslationConfig());
  }

  // create translated routes object
  private addTranslationConfig(): Route {
    const translatedRoutes = {
      path: this.currentLang,
      data: {path: this.currentLang, hide: true},
      children: this.parser.translateRouteParameters(this.originalRoutes, this.currentLang)
    };
    return translatedRoutes;
  }

  private updateDynamicRoutes(route?: Route): void {
    const initial  = !route;
    if (initial) {
      this.dynamicRoutes = this.parser.translateRouteParameters(this.originalRoutes, this.settings.defaultLang);
    } else {
      this.dynamicRoutes.unshift(route);
    }
    if (!this.dynamicRoutesSubject) {
      this.dynamicRoutesSubject = new BehaviorSubject(this.dynamicRoutes);
    } else {
      this.dynamicRoutesSubject.next(this.dynamicRoutes);
    }
    // reset router config
    this.router.resetConfig(this.dynamicRoutes);
  }

  private updateLang(lang: string): void {
    this.currentLang = lang;
    if (!this.currentLangSubject) {
      this.currentLangSubject = new BehaviorSubject(lang);
    } else {
      this.currentLangSubject.next(lang);
    }
  }
}
