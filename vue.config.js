const webpack = require('webpack');
module.exports = {

    // 静态资源路径
    publicPath:'',
        // process.env.NODE_ENV === "production" ? "/production-sub-path/" : "",
    // 输出文件名称
    outputDir: "dist",

    // 放置生成的静态资源 (js、css、img、fonts) 的目录(相对于outputDir目录)。
    assetsDir: "assets",

    // 入口index名称'index.html'[可带目录路径]
    indexPath: "index.html",

    // 文件是否带哈希
    filenameHashing: true,

    // 是否在开发环境下通过 eslint-loader 在每次保存时 lint 代码。这个值会在 @vue/cli-plugin-eslint 被安装之后生效。
    lintOnSave: false,//process.env.NODE_ENV !== "production",

    //是否使用包含运行时编译器的 Vue 构建版本。设置为 true 后你就可以在 Vue 组件中使用 template 选项了，但是这会让你的应用额外增加 10kb 左右。
    runtimeCompiler: false,

    // 如果你不需要生产环境的 source map，可以将其设置为 false 以加速生产环境构建。
    // productionSourceMap作用在于：项目打包后，代码都是经过压缩加密的，如果运行时报错，输出的错误信息无法准确得知是哪里的代码报错。
    // productionSourceMap=true就可以像未加密的代码一样，准确的输出是哪一行哪一列有错
    productionSourceMap: false,

    //多线程构建
    parallel:true,
    // 所有 webpack-dev-server 的选项都支持。
    devServer: {
        // host: "localhost",
        port: 8080, // 端口号
        https: false,
        open: true, //配置自动启动浏览器
        //配置多个代理
        // proxy: {
        //     "/": {
        //         target: "", // 本地模拟数据服务器
        //         changeOrigin: true,
        //         pathRewrite: {
        //             "^/": "/" // 去掉接口地址中的api字符串
        //         }
        //     }
        // }
    },

};
