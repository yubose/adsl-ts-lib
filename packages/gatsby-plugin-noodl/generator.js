"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGenerator = void 0;
const tslib_1 = require("tslib");
const u = tslib_1.__importStar(require("@jsmanifest/utils"));
const noodl_ui_1 = require("noodl-ui");
const fs_extra_1 = tslib_1.__importDefault(require("fs-extra"));
const monkeyPatchEventListener_1 = tslib_1.__importDefault(require("./monkeyPatchEventListener"));
u.newline();
const nui = noodl_ui_1.NUI;
// require('jsdom-global')('', {
//   resources: 'usable',
//   runScripts: 'dangerously',
//   url: `https://127.0.0.1:3001`,
//   beforeParse: (win: any) => {
//     global.EventTarget = win.EventTarget
//     global.localStorage = win.localStorage
//     // eslint-disable-next-line
//     localStorage = win.localStorage
//     // Silences the "getContext" is not implemented message during build
//     win.HTMLCanvasElement.prototype.getContext = () => ({} as any)
//   },
// })
/**
 * @typedef { import('noodl-ui').NuiComponent.Instance } NuiComponent
 * @typedef { import('noodl-ui').Page } NuiPage
 * @typedef { import('@babel/traverse').NodePath } NodePath
 */
function getGenerator({ configKey = 'www', configUrl = `https://public.aitmed.com/config/${configKey}.yml`, ecosEnv = 'stable', use = {}, } = {}) {
    var _a, _b, _c, _d;
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            // Patches the EventTarget so we can sandbox the sdk
            (0, monkeyPatchEventListener_1.default)({
                /**
                 * Proxy the addEventListener and removeEventListener to the JSDOM events so lvl3 doesn't give the IllegalInvocation error from mismatching instance shapes
                 */
                onPatch: u.reduce(['addEventListener', 'removeEventListener'], (acc, evtName) => {
                    /**
                     * @argument { object } args
                     * @param { boolean } args.wasPatched
                     */
                    acc[evtName] = function onPatch({ wasPatched, } = {}) {
                        let label = '';
                        label += u.yellow('EventTarget');
                        label += u.magenta('#');
                        label += u.white(evtName);
                        if (wasPatched) {
                            console.info(`${u.cyan(`${label} is already patched.`)}`);
                        }
                        else {
                            console.info(`${u.cyan(`${label}`)} ${u.green('patched!')}`);
                        }
                    };
                    return acc;
                }, {}),
            });
            // const { default: JsDOM } = await import('jsdom-global')
            // require('jsdom-global')('', {
            //   resources: 'usable',
            //   runScripts: 'dangerously',
            //   url: `https://127.0.0.1:3001`,
            //   beforeParse: (win: any) => {
            //     global.EventTarget = win.EventTarget
            //     global.localStorage = win.localStorage
            //     // eslint-disable-next-line
            //     localStorage = win.localStorage
            //     // Silences the "getContext" is not implemented message during build
            //     win.HTMLCanvasElement.prototype.getContext = () => ({} as any)
            //   },
            // })
            // Intentionally using require
            const { cache, CADL } = yield Promise.resolve().then(() => tslib_1.__importStar(require('@aitmed/cadl')));
            const sdk = new CADL({
                // aspectRatio: 0.59375,
                cadlVersion: ecosEnv,
                configUrl,
            });
            yield sdk.init({
                use: Object.assign(Object.assign({}, use.preload), { config: use.config, cadlEndpoint: use.appConfig }),
            });
            nui.use({
                getRoot: () => sdk.root,
                getAssetsUrl: () => sdk.assetsUrl,
                getBaseUrl: () => sdk.cadlBaseUrl,
                getPreloadPages: () => { var _a; return ((_a = sdk.cadlEndpoint) === null || _a === void 0 ? void 0 : _a.preload) || []; },
                getPages: () => { var _a; return ((_a = sdk.cadlEndpoint) === null || _a === void 0 ? void 0 : _a.page) || []; },
            });
            const pages = {};
            // App pages
            yield Promise.all(((_a = sdk.cadlEndpoint) === null || _a === void 0 ? void 0 : _a.page.map((pageName) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                var _e, _f, _g, _h, _j;
                try {
                    if ((_e = sdk.cadlEndpoint) === null || _e === void 0 ? void 0 : _e.preload.includes(pageName)) {
                        if (/^(Base[a-zA-Z0-9]+)/.test(pageName))
                            return;
                    }
                    const pageArg = ((_g = (_f = use.pages) === null || _f === void 0 ? void 0 : _f.json) === null || _g === void 0 ? void 0 : _g[pageName])
                        ? { pageName, cadlObject: (_j = (_h = use.pages) === null || _h === void 0 ? void 0 : _h.json) === null || _j === void 0 ? void 0 : _j[pageName] }
                        : pageName;
                    yield sdk.initPage(pageArg, [], {
                        wrapEvalObjects: false,
                    });
                    if (use.pages)
                        use.pages.json[pageName] = sdk.root[pageName];
                    pages[pageName] = sdk.root[pageName];
                }
                catch (error) {
                    const err = error instanceof Error ? error : new Error(String(error));
                    pages[pageName] = {
                        name: err.name,
                        message: err.message,
                        stack: err.stack,
                    };
                    console.log(`[${u.yellow(err.name)}] ${u.red(err.message)}`);
                }
            }))) || []);
            // Fixes navbar to stay at the top
            if (u.isObj((_c = (_b = sdk.root) === null || _b === void 0 ? void 0 : _b.BaseHeader) === null || _c === void 0 ? void 0 : _c.style)) {
                sdk.root.BaseHeader.style.top = '0';
            }
            const transformer = new noodl_ui_1.Transformer();
            const page = nui.createPage({
                id: 'root',
                name: ((_d = sdk.cadlEndpoint) === null || _d === void 0 ? void 0 : _d.startPage) || '',
                viewport: (use === null || use === void 0 ? void 0 : use.viewport) || { width: 0, height: 0 },
            });
            function transform(componentProp, options) {
                var _a;
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    if (!componentProp)
                        componentProp = {};
                    const component = nui.createComponent(componentProp, page);
                    const consumerOptions = nui.getConsumerOptions(Object.assign({ component,
                        page, viewport: use.viewport || page.viewport }, options));
                    yield transformer.transform(component, consumerOptions);
                    if (((_a = component.blueprint) === null || _a === void 0 ? void 0 : _a.viewTag) === 'imageUpdate' ||
                        component.props.viewTag === 'imageUpdate' ||
                        component.props['data-viewtag'] === 'imageUpdate') {
                        const imageUpdateComponentData = {
                            blueprint: component.blueprint,
                            component: component.toJSON(),
                            assetsUrl: options === null || options === void 0 ? void 0 : options.getAssetsUrl(),
                            baseUrl: options === null || options === void 0 ? void 0 : options.getBaseUrl(),
                            context: options === null || options === void 0 ? void 0 : options.context,
                            page: options === null || options === void 0 ? void 0 : options.page,
                            viewport: options === null || options === void 0 ? void 0 : options.viewport,
                        };
                        console.log(imageUpdateComponentData);
                        yield fs_extra_1.default.writeJson('imageUpdateComponentData', imageUpdateComponentData, { spaces: 2 });
                    }
                    return component;
                });
            }
            return { cache, nui: noodl_ui_1.NUI, page, pages, sdk, transform };
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            throw err;
        }
    });
}
exports.getGenerator = getGenerator;
//# sourceMappingURL=generator.js.map