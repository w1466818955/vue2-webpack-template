// vue.config.js
const PATH = require("path");
const resolve = (dir) => PATH.join(__dirname, ".", dir);
const IS_PRO_ENV = process.env.NODE_ENV === "production" ? true : false; // 判断是否是生产环境
const FileManagerPlugin = require("filemanager-webpack-plugin"); // 引入压缩包插件
const CompressionWebpackPlugin = require("compression-webpack-plugin"); // 开启gzip压缩(可选)
const productionGzipExtensions = /\.(js|css|json|txt|html|ico|svg)(\?.*)?$/i;
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin; // 打包分析
const TerserPlugin = require("terser-webpack-plugin"); // 打包时自动去除console.log插件
const PACKAGE_JSON = require("./package.json"); // 引入package.json
const DAY_JS = require("dayjs"); // 时间戳插件

let buildTime = DAY_JS(Date.now()).format("YYYYMMDDHHmm"); // 格式化时间
let zipName = `build-${ PACKAGE_JSON.productName ? PACKAGE_JSON.productName + "-v" + PACKAGE_JSON.version : "dist" }-${buildTime}`; // 压缩包名称

module.exports = {
  publicPath: IS_PRO_ENV ? "/" : "./", // 打包公共路径
  indexPath: "index.html", // 相对于打包路径index.html的路径
  outputDir: "dist", // 输出文件目录
  assetsDir: "static", //放置生成的静态资源(js、css、img、fonts)的目录
  lintOnSave: false, // 是否在开发环境下通过 eslint-loader 在每次保存时 lint 代码，false不需要
  productionSourceMap: false, // 生产环境是否生成 sourceMap 文件

  // 代理(跨域)配置
  devServer: {
    open: true, //是否自动弹出浏览器页面
    host: "10.10.0.64", // 本地服务器ip
    port: "8090", // 端口
    https: false, // https:{type:Boolean}
    hot: "only", // 热更新
    // 配置多个代理(跨域)
    proxy: {
      "/api": {
        target: "http://10.10.0.21:7007", // API服务器的地址
        ws: true, //代理websockets
        changeOrigin: true, // 允许跨域
        pathRewrite: {
          "^/api": "", //重写路径 比如'/api/aaa/ccc'重写为'/aaa/ccc'
        },
      },
    },
  },

  // 向 CSS 相关的 loader 传递选项
  css: {
    loaderOptions: {
      css: {
        // 这里的选项会传递给 css-loader
      },
      postcss: {
        // 这里的选项会传递给 postcss-loader
      },
    },
  },

  // 对内部的 webpack 配置进行更细粒度的修改
  chainWebpack: (config) => {
    config.resolve.symlinks(true); // 修复热更新失效

    // 配置路径别名
    config.resolve.alias
      .set("@", resolve("src"))
      .set("@assets", resolve("src/assets"))
      .set("@components", resolve("src/components"))
      .set("@router", resolve("src/router"))
      .set("@utils", resolve("src/utils"))
      .set("@store", resolve("src/store"))
      .set("@views", resolve("src/views"));

    if (IS_PRO_ENV) {
      // 配置打包分析工具
      config.plugin("webpack-bundle-analyzer").use(BundleAnalyzerPlugin).end();
      // 删除懒加载模块的 prefetch，降低带宽压力
      config.plugins.delete("prefetch");
    }
  },

  configureWebpack: (config) => {
    config.optimization.minimizer = [
      new TerserPlugin({
        terserOptions: {
          ecma: undefined,
          warnings: false,
          parse: {},
          compress: {
            drop_console: true,
            drop_debugger: false,
            pure_funcs: ["console.log"], // 移除console
          },
        },
      }),
    ];

    if (IS_PRO_ENV) {
      config.plugins.push(
        // 生成 (build-XX名称-XX版本号-当前时间).zip 的压缩包
        new FileManagerPlugin({
          onEnd: {
            mkdir: ["./dist"], // 新建 ./dist 目录
            archive: [{
              source: "./dist",
              destination: `${zipName}.zip`,
            }, ],
            // 删除dist文件
            delete: ["./dist"],
          },
        }),

        // GZip压缩
        new CompressionWebpackPlugin({
          filename: "[path].gz[query]",
          algorithm: "gzip",
          test: productionGzipExtensions,
          threshold: 10240, // 只有大小大于该值的资源会被处理 10240
          minRatio: 0.8, // 只有压缩率小于这个值的资源才会被处理
          deleteOriginalAssets: false, // 删除原文件
        })
      );
    }

    // 公共代码抽离
    config.optimization = {
      splitChunks: {
        cacheGroups: {
          vendor: {
            chunks: "all",
            test: /node_modules/,
            name: "vendor",
            minChunks: 1,
            maxInitialRequests: 5,
            minSize: 0,
            priority: 100,
          },
          common: {
            chunks: "all",
            test: /[\\/]src[\\/]js[\\/]/,
            name: "common",
            minChunks: 2,
            maxInitialRequests: 5,
            minSize: 0,
            priority: 60,
          },
          styles: {
            name: "styles",
            test: /\.(sa|sc|c)ss$/,
            chunks: "all",
            enforce: true,
          },
          runtimeChunk: {
            name: "manifest",
          },
        },
      },
    };
  },
};