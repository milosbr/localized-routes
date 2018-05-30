import { NgModule, NgModuleFactoryLoader, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LocalizedRoutesModuleLoader } from './localized-routes-module-loader';
import { LocalizedRoutesParser } from './localized-routes.parser';
import { LocalizedRoutesService } from './localized-routes.service';
import { LocalizeRoutePipe } from './localize-route.pipe';
import {
  LocalizedRoutesSettings,
  LocalizeRoutesDefaultLang,
  LocalizeRoutesLangs,
  LocalizeRoutesTranslations,
  DefaultLocalizedRoutesSettings
 } from './localized-routes.settings';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    LocalizeRoutePipe
  ],
  exports: [
    LocalizeRoutePipe
  ]
})
export class LocalizedRoutesModule {
  public static forRoot(userSettings): ModuleWithProviders {
    return {
      ngModule: LocalizedRoutesModule,
      providers: [
        { provide: LocalizeRoutesDefaultLang, useValue: userSettings.defaultLang },
        { provide: LocalizeRoutesLangs, useValue: userSettings.langs },
        { provide: LocalizeRoutesTranslations, useValue: userSettings.translations },
        LocalizedRoutesSettings,
        LocalizedRoutesParser,
        { provide: NgModuleFactoryLoader, useClass: LocalizedRoutesModuleLoader },
        LocalizedRoutesService
      ]
    };
  }

  public constructor(private localizedRoutesService: LocalizedRoutesService) {
    // init translation service and localize root routes
    this.localizedRoutesService.init();
  }
}
