import { Injectable, Inject, InjectionToken } from '@angular/core';

interface LocalizedRoutesSettingsInterface {
  defaultLang?: string;
  langs?: Array<string>;
  translations?: Object;
}

export const LocalizeRoutesDefaultLang = new InjectionToken<string>('localizeRoutesDefaultLang');
export const LocalizeRoutesLangs = new InjectionToken<Array<string>>('localizeRoutesLangs');
export const LocalizeRoutesTranslations = new InjectionToken<Object>('LocalizeRoutesTranslations');

export const DefaultLocalizedRoutesSettings: LocalizedRoutesSettingsInterface = {
  defaultLang: 'en',
  langs: ['en'],
  translations: {'en': {}}
};

@Injectable()
export class LocalizedRoutesSettings implements LocalizedRoutesSettingsInterface {

  constructor(
    @Inject(LocalizeRoutesDefaultLang) public defaultLang = DefaultLocalizedRoutesSettings.defaultLang,
    @Inject(LocalizeRoutesLangs) public langs = DefaultLocalizedRoutesSettings.langs,
    @Inject(LocalizeRoutesTranslations) public translations = DefaultLocalizedRoutesSettings.translations
  ) {}

}
