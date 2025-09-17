/*eslint-env node */
const https = require('https')
const fs = require('fs')

const ncuCfg = require('./.ncurc.json')
const pkg = require('./package.json')

// SDK-54
const url = 'https://raw.githubusercontent.com/expo/expo/sdk-54/packages/expo/bundledNativeModules.json'

const req = https.get(url, function (res) {
  let data = '',
    expoJsonData

  res.on('data', function (stream) {
    data += stream
  })
  res.on('end', function () {
    try {
      expoJsonData = JSON.parse(data)
      pkg.overrides = { ...pkg['overrides-base'] }
      pkg.overrides.react = expoJsonData['react']
      pkg.overrides['react-dom'] = expoJsonData['react-dom']
      ncuCfg.reject = ['tailwindcss', ...Object.keys(expoJsonData)]
      Object.keys(expoJsonData).forEach((dep) => {
        if (pkg.dependencies[dep]) {
          pkg.dependencies[dep] = expoJsonData[dep]
        }
        if (pkg.devDependencies[dep]) {
          pkg.devDependencies[dep] = expoJsonData[dep]
        }
      })
      fs.writeFileSync('.ncurc.json', JSON.stringify(ncuCfg, null, 2))
      fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2))
    } catch (error) {
      console.error(error)
    }
  })
})

req.on('error', function (e) {
  console.error(e.message)
})
