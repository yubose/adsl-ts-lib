process.stdout.write("\x1Bc")

/**
 * Configure your Gatsby site with this file.
 *
 * See: https://www.gatsbyjs.com/docs/gatsby-config/
 */

module.exports = {
  /* Your site config here */
  plugins: [
    {
      resolve: require.resolve("../packages/gatsby-plugin-noodl"),
      options: {
        config: {
          name: "www",
          protocol: "https",
          host: "public.aitmed.us",
          pathPrefix: "/config",
        },
        cwd: __dirname,
        languageSuffix: "en",
        viewport: {
          width: 375,
          height: 667,
        },
      },
    },
  ],
}
