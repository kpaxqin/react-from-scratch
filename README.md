# react-from-scratch

不到250行(without comments)代码实现的简单、可运行的"React.js"，帮助你简单理解React的实现原理。

主要参照官方文档 [Implementation notes](https://facebook.github.io/react/contributing/implementation-notes.html)

与真正React.js的主要差异，见[官方文档](https://facebook.github.io/react/contributing/implementation-notes.html#what-we-left-out),

为了能够真正运行，相比官方文档增加了

1. 文本节点渲染
2. 简单的setState，但不支持回调和批处理优化

## Usage

浏览器打开 `example/demo/index.html`，若在url后添加参数`native=true`则切换为使用真实React的版本

## Try your self

`npm i && npm run dev`

若修改了example下的文件，则需运行`npm run example`

## More

由于example的思路和一些最初的commits中途有调整，看起来可能会乱，后面可能会重新开一个更清晰的Repo
