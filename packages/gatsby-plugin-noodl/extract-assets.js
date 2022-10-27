"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractAssets = void 0;
const tslib_1 = require("tslib");
const u = tslib_1.__importStar(require("@jsmanifest/utils"));
const noodl_loader_1 = require("noodl-loader");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const path_1 = tslib_1.__importDefault(require("path"));
const utils_1 = tslib_1.__importDefault(require("./utils"));
function extractAssets(loader) {
    const aqua = chalk_1.default.keyword('aquamarine');
    const gold = chalk_1.default.keyword('navajowhite');
    // const white = chalk.white
    // const la = `${chalk.bold(chalk.keyword('orange')('<-'))}`
    const ra = `${chalk_1.default.bold(chalk_1.default.keyword('orange')('->'))}`;
    return function onAfterPluginInitLoad(gatsbyArgs, pluginOptions, helpers) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const { reporter } = gatsbyArgs;
            const { error: e, meta, verbose: v, warn } = helpers;
            const { cyan, red, yellow } = u;
            const preloads = loader.getPreload();
            const pages = loader.getPages();
            v(`App key: ${loader.appKey}`);
            v(`App loaded with ${cyan(preloads.length)} preload files and ` +
                `${cyan(pages.length)} page files`);
            v(`Searching missing assets...`);
            const extractedItems = [];
            const extractedIds = [];
            const fs = loader.getFileSystem();
            const skippedItems = [];
            const includeAssets = [
                'documents',
                'images',
                'scripts',
                'videos',
            ];
            v(`${aqua(String(includeAssets.length))} types of assets ` +
                `(${gold(includeAssets.join(', '))}) will be extracted`);
            function read(type, path) {
                switch (type) {
                    case 'image':
                    case 'pdf':
                    case 'video':
                        return fs.readFile(path, 'binary');
                    default:
                        return fs.readFile(path);
                }
            }
            try {
                for (const [_, node] of loader) {
                    const items = yield loader.extract(node, {
                        as: 'array',
                        include: includeAssets,
                    });
                    items.forEach((item) => {
                        const id = item.getId();
                        if (!extractedIds.includes(id)) {
                            extractedIds.push(id);
                            extractedItems.push(item);
                        }
                    });
                }
                yield Promise.all(u.array(extractedItems).map((item) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    var _a;
                    try {
                        const id = item.getId();
                        if (noodl_loader_1.is.url(id) || noodl_loader_1.is.file(id)) {
                            let { base: filename } = path_1.default.parse(id);
                            // @ts-ignore
                            // TODO - "data" here is not being used but is mentioned in multiple parts in this block. Find out if we need to do something more here
                            let data;
                            let dir = meta.getAssetsDirectory();
                            let filepath = path_1.default.join(dir, filename);
                            const type = noodl_loader_1.is.image(id)
                                ? 'image'
                                : noodl_loader_1.is.pdf(id)
                                    ? 'pdf'
                                    : noodl_loader_1.is.video(id)
                                        ? 'video'
                                        : 'text';
                            if (noodl_loader_1.is.file(id)) {
                                if (fs.existsSync(id)) {
                                    data = yield read(type, id);
                                    v(`Loaded ${gold(id)}`);
                                }
                                else if (fs.existsSync(filepath)) {
                                    data = yield read(type, filepath);
                                    v(`Loaded ${gold(id)}`);
                                }
                                else {
                                    reporter.error(`Could not find ${id === filepath ? id : `${id} or ${filepath}`} in the file system`);
                                }
                            }
                            else if (noodl_loader_1.is.url(id)) {
                                if (fs.existsSync(filepath)) {
                                    if (!skippedItems.includes(id))
                                        skippedItems.push(id);
                                    data = yield read(type, filepath);
                                }
                                else {
                                    v(`Downloading ${ra} ${gold(id)}`);
                                    data = yield utils_1.default.downloadFile(id, filename, dir, {
                                        notFound(_, url) {
                                            const logMsg = `"${url}" returned a ${u.red(`404 Not Found`)} error`;
                                            warn(logMsg);
                                        },
                                        otherError(err) {
                                            e(err, err, 'gatsby-plugin-noodl');
                                        },
                                    });
                                }
                            }
                        }
                    }
                    catch (error) {
                        const err = error instanceof Error ? error : new Error(String(error));
                        if ('response' in err) {
                            if (((_a = err['response']) === null || _a === void 0 ? void 0 : _a['status']) === 404) {
                                const logMsg = `The asset "${item.getId()}" `;
                                reporter.warn(logMsg + `returned a ${red(`404 Not Found`)} error`);
                            }
                        }
                        else {
                            reporter.error(`Error extracting ${gold(item.getId())} ` +
                                `[${yellow(err.name)}] ${red(err.message)}`);
                        }
                    }
                })));
                v(`Extracted ${gold(String(extractedIds.length))} assets from the app`);
                if (skippedItems.length) {
                    v(`Skipped ${gold(String(skippedItems.length))} ` +
                        `assets because they are already in the file system`);
                }
            }
            catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                reporter.error(`[${yellow(err === null || err === void 0 ? void 0 : err.name)}] Error while extracting assets ${ra} ${red(err.message)}`);
            }
        });
    };
}
exports.extractAssets = extractAssets;
//# sourceMappingURL=extract-assets.js.map