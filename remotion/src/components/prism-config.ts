// prism-config.ts
import Prism from 'prismjs';
import 'prismjs/plugins/keep-markup/prism-keep-markup';

// Configure keep-markup before any components are loaded (guarded for tests)
if ((Prism as any).plugins && (Prism as any).plugins.keepMarkup && (Prism as any).plugins.keepMarkup.addPreprocessor) {
  (Prism as any).plugins.keepMarkup.addPreprocessor((env: any) => {
    if (env.tag) {
      env.attributes['data-diff'] = '';
      env.keepMarkup = true;
    }
    return env;
  });
}