const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const isDevelopment = !isProduction;

  return {
    // Multiple entry points for better code splitting
    entry: {
      main: './src/client.ts',
      vendor: ['chart.js'],
      // Remove AI entry that uses server-side code
      // ai: './src/services/AIOrchestrator.ts',
    },
    
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: isDevelopment, // Faster compilation in dev
                experimentalWatchApi: true,
              },
            },
          ],
          exclude: /node_modules/,
        },
        {
          test: /\.s[ac]ss$/i,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            {
              loader: 'css-loader',
              options: {
                sourceMap: isDevelopment,
                modules: {
                  auto: true,
                  localIdentName: isProduction ? '[hash:base64:5]' : '[local]--[hash:base64:5]',
                },
              },
            },
            {
              loader: 'sass-loader',
              options: {
                sourceMap: isDevelopment,
                api: 'modern', // Use modern Sass API
                sassOptions: {
                  silenceDeprecations: ['legacy-js-api']
                }
              },
            },
          ],
        },
        {
          test: /\.css$/i,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            {
              loader: 'css-loader',
              options: {
                sourceMap: isDevelopment,
              },
            },
          ],
        },
        {
          test: /\.(png|jpe?g|gif|svg|ico)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/images/[name].[hash][ext]',
          },
          parser: {
            dataUrlCondition: {
              maxSize: 8 * 1024, // 8kb - inline small images
            },
          },
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/fonts/[name].[hash][ext]',
          },
        },
      ],
    },
    
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@services': path.resolve(__dirname, 'src/services'),
        '@controllers': path.resolve(__dirname, 'controllers'),
        '@models': path.resolve(__dirname, 'src/models'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@types': path.resolve(__dirname, 'src/types'),
      },
      fallback: {
        "crypto": require.resolve("crypto-browserify"),
        "stream": require.resolve("stream-browserify"),
        "assert": require.resolve("assert"),
        "http": require.resolve("stream-http"),
        "https": require.resolve("https-browserify"),
        "os": require.resolve("os-browserify"),
        "url": require.resolve("url"),
        "zlib": require.resolve("browserify-zlib"),
        "path": require.resolve("path-browserify"),
        "querystring": require.resolve("querystring-es3"),
        "buffer": require.resolve("buffer"),
        "util": require.resolve("util"),
        "vm": require.resolve("vm-browserify"),
        "timers": require.resolve("timers-browserify"),
        "process": require.resolve("process/browser"),
        "child_process": false,
        "async_hooks": false,
        "fs": false,
        "net": false,
        "tls": false,
      },
    },
    
    externals: {
      // Exclude Node.js specific modules from browser bundle
      'node-gyp': 'commonjs node-gyp',
      'npm': 'commonjs npm',
      'mock-aws-s3': 'commonjs mock-aws-s3',
      'aws-sdk': 'commonjs aws-sdk',
      'nock': 'commonjs nock'
    },
    
    output: {
      filename: isProduction ? 'js/[name].[contenthash:8].js' : 'js/[name].js',
      chunkFilename: isProduction ? 'js/[name].[contenthash:8].chunk.js' : 'js/[name].chunk.js',
      path: path.resolve(__dirname, 'dist/public'),
      publicPath: '/',
      clean: true,
      assetModuleFilename: 'assets/[name].[hash][ext]',
    },
    
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: isProduction, // Remove console.log in production
            },
            format: {
              comments: false, // Remove comments in production
            },
          },
          extractComments: false,
        }),
        new CssMinimizerPlugin(),
      ],
      
      splitChunks: {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          // Vendor libraries
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            chunks: 'all',
          },
          // Chart.js specific bundle
          charts: {
            test: /[\\/]node_modules[\\/](chart\.js|chartjs-)/,
            name: 'charts',
            priority: 20,
            chunks: 'all',
          },
          // AI services bundle
          ai: {
            test: /src[\\/]services[\\/](AI|ai)/,
            name: 'ai-services',
            priority: 15,
            chunks: 'all',
            minChunks: 1,
          },
          // Common utilities
          common: {
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      },
      
      runtimeChunk: {
        name: 'runtime',
      },
      
      // Tree shaking optimization
      usedExports: true,
      sideEffects: false,
    },
    
    plugins: [
      new HtmlWebpackPlugin({
        template: './index.html',
        filename: 'index.html',
        inject: false, // We're manually managing script tags
        minify: isProduction ? {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true,
        } : false,
      }),
      
      // Extract CSS in production
      ...(isProduction ? [
        new MiniCssExtractPlugin({
          filename: 'css/[name].[contenthash:8].css',
          chunkFilename: 'css/[name].[contenthash:8].chunk.css',
        }),
        new CompressionPlugin({
          algorithm: 'gzip',
          test: /\.(js|css|html|svg)$/,
          threshold: 8192,
          minRatio: 0.8,
        }),
      ] : []),
      
      // Bundle analyzer for development
      ...(env && env.analyze ? [new BundleAnalyzerPlugin()] : []),
    ],
    
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist/public'),
      },
      compress: true,
      port: 8080,
      hot: true, // Hot Module Replacement
      historyApiFallback: true,
      open: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          logLevel: 'debug',
        },
      },
      client: {
        overlay: {
          errors: true,
          warnings: false,
        },
      },
    },
    
    devtool: isDevelopment ? 'eval-source-map' : 'source-map',
    
    // Performance hints
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 500000, // 500kb
      maxAssetSize: 300000, // 300kb
    },
    
    stats: {
      errorDetails: true,
      children: false,
      modules: false,
    },
  };
};
