"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const chai_1 = require("chai");
const u = tslib_1.__importStar(require("@jsmanifest/utils"));
// import fg from 'fast-glob'
const fs_extra_1 = tslib_1.__importDefault(require("fs-extra"));
// import path from 'path'
const sinon_1 = tslib_1.__importDefault(require("sinon"));
const app_root_path_1 = tslib_1.__importDefault(require("app-root-path"));
const mock_fs_1 = tslib_1.__importDefault(require("mock-fs"));
const gatsby_node_1 = require("../gatsby-node");
const utils_1 = require("../utils");
// const rootDir = appRoot.toString()
// const cwd = process.cwd()
// function getAllFiles() {
/** @type { string[] } */
// const files = []
// const dirfiles = fs.readdirSync('.')
// for (const filename of dirfiles) {
//
// }
// }
const getMockCache = () => {
    const cache = new Map();
    return {
        get: (key) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            return key === undefined
                ? [...cache.entries()].reduce((acc, [k, v]) => u.assign(acc, { [k]: v }), {})
                : cache.get(key);
        }),
        set: (key, value) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            cache.set(key, value);
        }),
    };
};
beforeEach(() => {
    (0, gatsby_node_1.reset)();
    (0, mock_fs_1.default)({
        node_modules: {
            winston: {
                lib: {
                    winston: {
                        transports: {
                            'console.js': mock_fs_1.default.file({ content: '' }),
                        },
                    },
                },
            },
        },
        packages: {
            'gatsby-plugin-noodl': {
                src: {
                    'gatsby-node.ts': mock_fs_1.default.file({ content: '' }),
                    'generator.ts': mock_fs_1.default.file({ content: '' }),
                    'index.ts': mock_fs_1.default.file({ content: '' }),
                    'monkeyPatchEventListener.ts': mock_fs_1.default.file({ content: '' }),
                    'types.ts': mock_fs_1.default.file({ content: '' }),
                    'utils.ts': mock_fs_1.default.file({ content: '' }),
                },
                __tests__: {},
                node_modules: {},
                'gatsby-node.js': mock_fs_1.default.file({ content: '' }),
                'package.json': mock_fs_1.default.file({ content: '{}' }),
                'tsconfig.json': mock_fs_1.default.file({ content: '{}' }),
                'types.d.ts': mock_fs_1.default.file({ content: '' }),
                'utils.js': mock_fs_1.default.file({ content: '' }),
            },
        },
        apps: {
            static: {
                src: {
                    resources: {
                        assets: {
                            items: [
                                'a_animation1.png',
                                'a_animation2.png',
                                'a_animation3.png',
                                'abdominal_pain_in_children.png',
                                'aboutRed.svg',
                                'IconAwesomeCheck.png',
                                'zhuanquan.gif',
                            ].reduce((acc, filename) => u.assign(acc, {
                                [filename]: mock_fs_1.default.file({ content: Buffer.from([]) }),
                            }), {}),
                        },
                        images: {
                            'logo.png': mock_fs_1.default.file({ content: Buffer.from([]) }),
                        },
                        'favicon.ico': mock_fs_1.default.file({ content: 'favicon data' }),
                    },
                    static: {
                        'BaseCSS.json': mock_fs_1.default.file({ content: '{}' }),
                        'logo.png': mock_fs_1.default.file({ content: Buffer.from([]) }),
                        'robots.txt': mock_fs_1.default.file({ content: '' }),
                    },
                    templates: {
                        'page.tsx': mock_fs_1.default.file({ content: '' }),
                    },
                    'theme.ts': mock_fs_1.default.file({ content: '' }),
                },
                [`gatsby-browser.js`]: mock_fs_1.default.file({ content: '' }),
                [`gatsby-config.js`]: mock_fs_1.default.file({ content: '' }),
                [`gatsby-node.js`]: mock_fs_1.default.file({ content: '' }),
                [`gatsby-ssr.js`]: mock_fs_1.default.file({ content: '' }),
                [`package.json`]: mock_fs_1.default.file({ content: '{}' }),
                [`tsconfig.json`]: mock_fs_1.default.file({ content: '{}' }),
            },
        },
    }, { createCwd: true });
});
afterEach(() => {
    mock_fs_1.default.restore();
});
// const getDumpedMetadata = () => dumpMetadata()
describe.only(`gatsby-node.js`, () => {
    it(``, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        console.log(`Mock root:`);
        console.log(fs_extra_1.default.readdirSync('.'));
        console.log(app_root_path_1.default.toString());
        console.log(process.cwd());
        console.log(__dirname);
    }));
    describe(`onPreInit`, () => {
        it(`should convert back slashes to forward slashes on all provided paths from the user`, () => {
            const pluginOptions = {
                output: 'meetd2',
                src: 'C:\\Users\\Chris\\abc\\drafts',
                template: 'D:/Users\\Chris/drafts',
            };
            // @ts-expect-error
            (0, gatsby_node_1.onPreInit)({ reporter: { setVerbose: sinon_1.default.spy() } }, pluginOptions);
            (0, chai_1.expect)(pluginOptions.output).to.eq('meetd2');
            (0, chai_1.expect)(pluginOptions.src).to.eq('C:/Users/Chris/abc/drafts');
            (0, chai_1.expect)(pluginOptions.template).to.eq('D:/Users/Chris/drafts');
        });
    });
    describe.only(`onPluginInit`, () => {
        describe(`when processing paths`, () => {
            it(``, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
                const meta = new utils_1.Metadata();
                const pluginOpts = { metadata: meta };
                console.log(process.cwd());
                // @ts-expect-error
                yield (0, gatsby_node_1.onPluginInit)({ cache: { directory: '.cache' } }, pluginOpts);
            }));
        });
        xit(`should set the cwd`, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () { }));
        xit(`should set the configKey`, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () { }));
        xit(`should set the configUrl`, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () { }));
        xit(`should set the deviceType`, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () { }));
        xit(`should set the ecosEnv`, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () { }));
        xit(`should set the loglevel`, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () { }));
        xit(`should set resolvedOutputNamespacedWithConfig`, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () { }));
        xit(`should set resolvedAssetsDir`, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () { }));
        xit(`should set resolvedConfigsDir`, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () { }));
        xit(`should set the appKey`, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () { }));
        xit(`should set resolvedAppConfigFile`, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () { }));
        xit(`should set the loader`, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () { }));
        xit(`should set the ecos env on the loader`, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () { }));
        xit(`should set the config key on the loader`, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () { }));
        xit(`should set load the root config on the loader from the directory`, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () { }));
        xit(`should save each jsonified preload page in the pages object`, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () { }));
        xit(`should save each jsonified page in the pages object`, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () { }));
        xit(`should create the output dir if it doesn't exist`, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () { }));
        xit(`should create the assets dir if it doesn't exist`, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () { }));
        xit(`should create the config folder in the output dir if it doesn't exist`, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () { }));
        xit(`should save the app config file if it doesn't exist`, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () { }));
        xit(`should load the app config on the loader`, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () { }));
        xit(`should load the app config using the provided fallback function if it couldn't fetch remotely`, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () { }));
        xit(`should download each page yml file to disk if it doesn't exist`, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () { }));
        xit(`should download each asset file to disk if it doesn't exist`, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () { }));
        xit(`should detect missing page files`, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () { }));
        xit(`should detect missing asset files`, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () { }));
        xit(`should download missing page files`, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () { }));
        xit(`should download missing asset files`, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () { }));
        xit(`should set the configKey and configUrl in cache`, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            const cache = getMockCache();
            yield (0, gatsby_node_1.onPluginInit)(
            // @ts-expect-error
            { cache }, {
                config: 'meetd2',
                path: 'C:\\Users\\Chris\\abc\\drafts',
                template: 'D:/Users\\Chris/drafts',
            });
            (0, chai_1.expect)(yield cache.get('configKey')).to.eq('meetd2');
            (0, chai_1.expect)(yield cache.get('configUrl')).to.eq('https://public.aitmed.com/config/meetd2.yml');
        }));
    });
    describe(`sourceNodes`, () => {
        xit(``, () => {
            //
        });
    });
    describe(`createPages`, () => {
        xit(``, () => {
            //
        });
    });
    describe(`onCreatePage`, () => {
        xit(``, () => {
            //
        });
    });
});
//# sourceMappingURL=gatsby-node.test.js.map