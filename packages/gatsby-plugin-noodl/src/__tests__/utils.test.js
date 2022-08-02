"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const chai_1 = require("chai");
const utils_1 = tslib_1.__importDefault(require("../../utils"));
describe(`utils`, () => {
    describe(`getConfigVersion`, () => {
        it(`should return the config version`, () => {
            (0, chai_1.expect)(utils_1.default.getConfigVersion({ web: { cadlVersion: { stable: 1.07 } } })).to.eq(1.07);
        });
    });
    describe(`regex`, () => {
        describe(`single strings`, () => {
            describe(`cadlBaseUrlPlaceholder `, () => {
                it(`should match \${cadlBaseUrl}`, () => {
                    (0, chai_1.expect)(utils_1.default.regex.cadlBaseUrlPlaceholder.test('${cadlBaseUrl}')).to
                        .be.true;
                });
                it(`should match \${cadlVersion}`, () => {
                    (0, chai_1.expect)(utils_1.default.regex.cadlVersionPlaceholder.test('https://public.aitmed.com/cadl/admindd${cadlVersion}/')).to.be.true;
                });
                it(`should match \${designSuffix}`, () => {
                    (0, chai_1.expect)(utils_1.default.regex.designSuffixPlaceholder.test('${designSuffix}')).to
                        .be.true;
                });
            });
        });
        describe(`objects`, () => {
            // const getConfig = () => ({
            //   apiHost: 'albh3.aitmed.io',
            //   apiPort: '443',
            //   web: { cadlVersion: { stable: 6.41, test: 6.41 } },
            //   cadlBaseUrl: 'https://public.aitmed.com/cadl/admindd${cadlVersion}/',
            //   cadlMain: 'cadlEndpoint.yml',
            //   assetsUrl: '${cadlBaseUrl}assets/',
            // })
            // const getCadlBaseUrl = () => getConfig().cadlBaseUrl
            // it(`should keep the same object shape but replace the noodl placeholders`, () => {
            //   const result = utils.replaceNoodlPlaceholders(
            //     {
            //       cadlBaseUrl: getCadlBaseUrl(),
            //       cadlVersion: 6.41,
            //     },
            //     getConfig(),
            //   )
            //   expect(result)
            //     .to.be.an('object')
            //     .to.have.property(
            //       'cadlBaseUrl',
            //       `https://public.aitmed.com/cadl/admindd6.41/`,
            //     )
            //   expect(result)
            //     .to.be.an('object')
            //     .to.have.property(
            //       'assetsUrl',
            //       `https://public.aitmed.com/cadl/admindd6.41/assets/`,
            //     )
            // })
        });
    });
    describe(`replaceNoodlPlaceholders`, () => {
        // const config = { web: { cadlVersion: { stable: 1.07 } } }
        // for (const [cadlBaseUrl, expectedValue] of [
        //   [
        //     'https://public.aitmed.com/cadl/admindd${cadlVersion}/',
        //     'https://public.aitmed.com/cadl/admindd1.07/',
        //   ],
        // ]) {
        // expect(
        //   utils.replaceNoodlPlaceholders(
        //     {
        //       cadlBaseUrl,
        //       cadlVersion: 1.07,
        //     },
        //     cadlBaseUrl,
        //   ),
        // ).to.eq(expectedValue)
        // }
    });
});
//# sourceMappingURL=utils.test.js.map