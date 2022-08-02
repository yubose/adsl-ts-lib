"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/**
 * Tests are following this template:
 * https://www.gatsbyjs.com/docs/files-gatsby-looks-for-in-a-plugin/
 */
const chai_1 = require("chai");
const package_json_1 = tslib_1.__importDefault(require("../../package.json"));
const pluginName = 'gatsby-plugin-noodl';
const entryPoint = 'index.js';
describe(`setup`, () => {
    describe(`package.json`, () => {
        it(`should have a value in the "main" field`, () => {
            (0, chai_1.expect)(package_json_1.default.main).not.to.be.empty;
            (0, chai_1.expect)(package_json_1.default.main).to.eq(entryPoint);
        });
        it(`should have a value in the "name" field`, () => {
            (0, chai_1.expect)(package_json_1.default.name).not.to.be.empty;
            (0, chai_1.expect)(package_json_1.default.name).to.eq(pluginName);
        });
        /**
         * REMINDER: Put back the "version" field when releasing this plugin to the npm registry
         */
        xit(`should have a value in the "version" field`, () => {
            (0, chai_1.expect)(package_json_1.default.version).not.to.be.empty;
        });
    });
});
//# sourceMappingURL=setup.test.js.map