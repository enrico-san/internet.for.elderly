module.exports = {
    pluginOptions: {
      electronBuilder: {
        preload: 'src/preload.js',
        contextIsolation: false,
      }
    },
    configureWebpack: {
        devtool: "source-map"
    }  
}