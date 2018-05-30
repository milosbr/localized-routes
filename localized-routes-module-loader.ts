import { ROUTES } from '@angular/router';
import {
  SystemJsNgModuleLoader,
  NgModuleFactory,
  Injector,
  SystemJsNgModuleLoaderConfig,
  Optional,
  Compiler,
  Injectable

} from '@angular/core';
import { LocalizedRoutesParser } from './localized-routes.parser';

// Extension of SystemJsNgModuleLoader to enable localization of routes on lazy load modules
@Injectable()
export class LocalizedRoutesModuleLoader extends SystemJsNgModuleLoader {

  constructor(
    private localize: LocalizedRoutesParser,
    _compiler: Compiler,
    @Optional() config?: SystemJsNgModuleLoaderConfig
  ) {
    super(_compiler, config);
  }

  // Extend load with custom functionality
  load(path: string): Promise<NgModuleFactory<any>> {

    return super.load(path).then((factory: NgModuleFactory<any>) => {
      return {
        moduleType: factory.moduleType,
        create: (parentInjector: Injector) => {
          const module = factory.create(parentInjector);
          const getMethod = module.injector.get.bind(module.injector);
          module.injector['get'] = (token: any, notFoundValue: any) => {
            const getResult = getMethod(token, notFoundValue);
            if (token === ROUTES) {
              // translate lazy loaded routes
              return this.localize.translateRouteParameters([].concat(...getResult));
            } else {
              return getResult;
            }
          };
          return module;
        }
      };
    });
  }
}
