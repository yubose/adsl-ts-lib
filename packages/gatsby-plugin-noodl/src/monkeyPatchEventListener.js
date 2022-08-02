"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPathsToEventTargetFile = void 0;
const tslib_1 = require("tslib");
const u = tslib_1.__importStar(require("@jsmanifest/utils"));
const fs_extra_1 = tslib_1.__importDefault(require("fs-extra"));
const path_1 = tslib_1.__importDefault(require("path"));
const core_1 = require("@babel/core");
/**
 * Returns the path to the EventTarget file so it can be patched
 * @returns { string[] }
 */
function getPathsToEventTargetFile() {
    const getFromCwd = (...p) => path_1.default.resolve(path_1.default.join(process.cwd(), ...p, 'node_modules/jsdom/lib/jsdom/living/generated/EventTarget.js'));
    const getFromCurrentDir = (...p) => path_1.default.resolve(path_1.default.join(__dirname, ...p, 'node_modules/jsdom/lib/jsdom/living/generated/EventTarget.js'));
    return [
        getFromCwd('..', '..', '..'),
        getFromCwd('..', '..'),
        getFromCwd('..'),
        getFromCurrentDir('..', '..', '..'),
        getFromCurrentDir('..', '..'),
        getFromCurrentDir('..'),
    ];
}
exports.getPathsToEventTargetFile = getPathsToEventTargetFile;
/**
 * addEventListener is preving sdk from sandboxing.
 * We must monkey patch the EventTarget
 */
function monkeyPatchAddEventListener(opts) {
    /**
     * Returns true if this node is the wrapper that encapsulates the declaration of class EventTarget
     */
    const isExportsStatementWrappingEventTarget = (p) => {
        // @ts-expect-error
        if (core_1.types.isAssignmentExpression(p.node.expression)) {
            const { left, right, operator } = p.node
                .expression;
            return (operator === '=' &&
                core_1.types.isMemberExpression(left) &&
                core_1.types.isIdentifier(left.object) &&
                core_1.types.isIdentifier(left.property) &&
                left.object.name === 'exports' &&
                left.property.name === 'install' &&
                core_1.types.isArrowFunctionExpression(right));
        }
    };
    const getEventTargetClassStatement = (expr) => {
        if (core_1.types.isBlockStatement(expr.body)) {
            return expr.body.body.find((statement) => core_1.types.isClassDeclaration(statement));
        }
        return null;
    };
    const getClassMethod = (node, name) => {
        if (core_1.types.isClassBody(node.body)) {
            return node.body.body.find(
            // @ts-expect-error
            (o) => core_1.types.isClassMethod(o) && o.key.name === name);
        }
        return null;
    };
    const isMethodPatched = (node) => {
        return (core_1.types.isBlockStatement(node.body) && core_1.types.isReturnStatement(node.body.body[0]));
    };
    getPathsToEventTargetFile().forEach((filepath) => {
        try {
            if (!fs_extra_1.default.existsSync(filepath))
                return;
            console.log(`Patching ${u.white(filepath)}`);
            const code = fs_extra_1.default.readFileSync(filepath, 'utf8');
            const ast = (0, core_1.parse)(code);
            let eventListenersWerePatched = true;
            (0, core_1.traverse)(ast, {
                ExpressionStatement(p) {
                    var _a, _b, _c, _d;
                    if (isExportsStatementWrappingEventTarget(p)) {
                        const eventTargetClass = getEventTargetClassStatement(
                        // @ts-expect-error
                        p.node.expression.right);
                        const addEventListenerMethod = getClassMethod(eventTargetClass, 'addEventListener');
                        const removeEventListenerMethod = getClassMethod(eventTargetClass, 'removeEventListener');
                        for (const [evtName, method] of [
                            ['addEventListener', addEventListenerMethod],
                            ['removeEventListener', removeEventListenerMethod],
                        ]) {
                            // @ts-expect-error
                            if (isMethodPatched(method)) {
                                (_b = (_a = opts === null || opts === void 0 ? void 0 : opts.onPatch) === null || _a === void 0 ? void 0 : _a[evtName]) === null || _b === void 0 ? void 0 : _b.call(_a, { wasPatched: true });
                            }
                            else {
                                eventListenersWerePatched = false;
                                (_d = (_c = opts === null || opts === void 0 ? void 0 : opts.onPatch) === null || _c === void 0 ? void 0 : _c[evtName]) === null || _d === void 0 ? void 0 : _d.call(_c, { wasPatched: false });
                                // @ts-expect-error
                                if (core_1.types.isBlockStatement(method.body)) {
                                    // @ts-expect-error
                                    method.body.body.unshift(core_1.types.returnStatement());
                                }
                            }
                        }
                        return p.stop();
                    }
                },
            });
            if (!eventListenersWerePatched) {
                const result = (0, core_1.transformFromAstSync)(ast);
                fs_extra_1.default.writeFileSync(filepath, (result === null || result === void 0 ? void 0 : result.code) || '', 'utf8');
                return result;
            }
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.log(`[${u.yellow(err.name)}] ${u.red(err.message)}`);
        }
    });
}
exports.default = monkeyPatchAddEventListener;
//# sourceMappingURL=monkeyPatchEventListener.js.map