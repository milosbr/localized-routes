import { Routes, Route } from '@angular/router';
import { Injectable, Inject } from '@angular/core';
import { LocalizedRoutesSettings } from './localized-routes.settings';

type pathType = Array<string> | string;
interface TranslationObject {
  value: string;
  noTranslation: boolean;
}

@Injectable()
export class LocalizedRoutesParser {

  // parameters used for URL string translation
  // translated URL as array
  private pathArray: Array<string> = [''];
  // original URL as array
  private currentPathArray: Array<string> = [];

  constructor(private settings: LocalizedRoutesSettings) { }

  // translate routes array
  public translateRouteParameters(rawRoutes: Routes, selectedLang?: string): Routes {
    const lang = selectedLang ? selectedLang : this.settings.defaultLang;
    const newRoutes: Routes = [];
    for (let i = 0; i < rawRoutes.length; i++) {
      newRoutes.push(Object.assign({}, rawRoutes[i]));
      if (rawRoutes[i].path) {
        // add original path parameter to data obj
        // Used as index to help identify translated route from URL
        if (!newRoutes[i].data) { newRoutes[i].data = {}; }
        newRoutes[i].data.path = rawRoutes[i].path;
        // translate path parameter
        newRoutes[i].path = <string>this.translatePath(rawRoutes[i].path, lang);
      }
      if (rawRoutes[i].redirectTo) {
        // translate redirectTo parameter
        newRoutes[i].redirectTo = <string>this.translatePath(rawRoutes[i].redirectTo, lang);
      }
      if (rawRoutes[i].children && rawRoutes[i].children.length) {
        // do it recursively
        newRoutes[i].children = this.translateRouteParameters(rawRoutes[i].children, lang);
      }
    }
    return newRoutes;
  }

  // translate route param
  public translatePath(path: pathType, lang: string, localizeRoute?: boolean): pathType {
    const pathArray = (typeof path === 'string') ? path.split('/') : path;
    if (!pathArray.length) { return pathArray; }
    const translatePathArray = pathArray.map((fragment, index) => this.translateInstant(fragment, lang).value);
    if (localizeRoute) {
      this.changeLangInUrl(translatePathArray, lang);
    }
    return (Array.isArray(path)) ? translatePathArray : translatePathArray.join('/');
  }

  // translate URL to newly chosen lang URL
  public translatePathFromString(path: string, lang: string, activeRoute): string {
    // reset pathArray and currentPathArray
    this.resetPath();
    const langUrlString = (lang === this.settings.defaultLang) ? '' : lang;
    // if root path in URL, redirect to root lang path
    if (!path || path === '/') { return '/' + langUrlString; };
    // get current URL as array
    this.currentPathArray = path.split('/');
    // create translated pathArray using ActivatedRoute.pathFromRoot and routeConfig.data.path
    this.getPathArray(activeRoute.pathFromRoot[0], lang);
    // self explainable
    this.changeLangInUrl(this.pathArray, lang);
    // return as URL string
    return this.pathArray.join('/');
  }

  // recursively go through activatedRoute.pathFromRoot and create translated path array
  // using routeConfig parameters
  private getPathArray(snapshot, lang: string): void {
    const routeConfig = snapshot.routeConfig;
    // skip if route has no routeConfig or path parameter
    if (!routeConfig || !routeConfig.path) {
      if (snapshot.children.length === 1) { this.getPathArray(snapshot.children[0], lang); }
      return;
    }
    // create array from original path parameter, if contains '/'
    const originalPath = routeConfig.data.path;
    const decomposedSegment = (originalPath.indexOf('/') !== -1) ? originalPath.split('/') : null;

    // path parameter is string without '/' - i.e. {path:'competitions'}
    if (!decomposedSegment) {
      const originalSegment = this.translateInstant(originalPath, lang);
      // if path parameter is dynamic, replace it with acutal value - i.e. {path:':id'}
      const segmentString =
        (originalSegment.value.indexOf(':') === 0) ?
        this.currentPathArray[this.pathArray.length] :
        originalSegment.value;

      this.pathArray.push(segmentString);
      if (snapshot.children.length === 1) { this.getPathArray(snapshot.children[0], lang); }
      return;
    }

    // path parameter contains '/' - i.e. {path:'user/profile'}
    // use array
    const currentSegmentString = decomposedSegment.reduce((segmentString, part, i) => {
      const index = this.pathArray.length + i;
      const translatedPart = this.translateInstant(part, lang);
      // if path parameter is dynamic, replace it with acutal value - i.e. {path:':id'}
      const partValue =
        (translatedPart.value.indexOf(':') !== -1) ?
        this.currentPathArray[index] :
        translatedPart.value;
      return (segmentString) ? segmentString + '/' + partValue : partValue;
    }, '');

    this.currentPathArray.splice(this.pathArray.length, decomposedSegment.length, currentSegmentString);
    this.pathArray.push(currentSegmentString);
    // do it recursively, till last route segment
    if (snapshot.children.length === 1) { this.getPathArray(snapshot.children[0], lang); }
  }

  private translateInstant(pathSegment: string, lang: string): TranslationObject {
    // if translation doesn't exist, return original pathSegment
    if (this.settings.translations[lang] && this.settings.translations[lang][pathSegment]) {
      return {
        value: this.settings.translations[lang][pathSegment],
        noTranslation: false
      };
    }
    return {
      value: pathSegment,
      noTranslation: true
    };
  }

  // a bit complicated logic for adding/changing/removing lang in URL
  private changeLangInUrl(pathArray: Array<any>, lang: string): void {
    // set lang string that should go to URL
    const langUrlString = (lang !== this.settings.defaultLang) ? lang : '';

    // check if first element in array is '/' or '' - i.e. ['/', 'user', 'profiles', 'Lomi']
    if ((pathArray[0] === '/' || pathArray[0] === '')) {

      // case: if language already in URL
      if (this.settings.langs.indexOf(pathArray[1]) !== -1) {
        // if default lang, remove lang string from URL
        if (!langUrlString) {
          pathArray.splice(1, 1);
        } else {
        // not default lang, replace lang string in URL
          pathArray[1] = langUrlString;
        }

      // special case: lang not in URL and pathArray === ['','']
      } else if (pathArray.length === 2 && pathArray[1] === '') {
        pathArray[0] = '/' + langUrlString;
        pathArray.pop();

      // case: lang not in URL and currentLang !== defaultLng
      } else if (langUrlString) {
        pathArray[0] = '/' + langUrlString;
      }

    // special case - '/' is part of pathArray[0] - i.e. ['/user', 'profiles', 'Lomi']
    } else if (pathArray[0].indexOf('/') === 0) {
      const firstUrlSegment = pathArray[0].substr(1);
      // case: on translated route - i.e. ['/da', 'user', 'profil']
      if (this.settings.langs.indexOf(firstUrlSegment) !== -1) {
        pathArray[0] = '/' + langUrlString;
      // case not on translated route, and not default lang
      } else if (langUrlString) {
        pathArray[0] = firstUrlSegment;
        pathArray.unshift('/' + langUrlString);
      }
    }
  }

  private resetPath(): void {
    this.pathArray = [''];
    this.currentPathArray = [];
  }
}
