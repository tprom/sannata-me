import nextIntl from "next-intl/plugin";

const withNextIntl = nextIntl("./i18n/request.ts");

export default withNextIntl({
  reactStrictMode: false,
  webpack: (config, { webpack }) => {
    config.ignoreWarnings = config.ignoreWarnings || [];
    config.ignoreWarnings.push((warning) => {
      try {
        const msg =
          warning &&
          (warning.message ||
            (warning.module && warning.module.userRequest) ||
            "");
        if (
          typeof msg === "string" &&
          msg.includes("next-intl") &&
          msg.includes("import(t)")
        ) {
          return true;
        }
      } catch (e) {
        // ignore
      }
      return false;
    });
    // Ignore warnings coming from next-intl dynamic import parsing which are benign
    config.ignoreWarnings.push(/next-intl/);
    return config;
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/favicon.ico",
          destination: "/public/favicon.ico",
        },
      ],
    };
  },
});
