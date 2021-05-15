console.log('preload.js loaded')

import { contextBridge } from 'electron'

const got = require('got')
const { exec } = require('child_process')

let log = data => errors.push(data);
const errors = []

// window.addEventListener('DOMContentLoaded', () => {

// })

let channels = {}

// move this to store/index.js to make list reactive
async function retrieve_channels() {
  try {
    console.log('get channel guide')
    const { body } = await got(process.env.I4E_CHANNELS_URL)
    console.log('got channel guide')
    channels = JSON.parse(body)
    console.log('parsed channel guide', channels)
  } catch (error) {
    console.log('error in channel guide')
    log && log(error.response.body);
    !log && errors.push(error.response.body)
  }

}

retrieve_channels()
setInterval(() => {
  retrieve_channels()
}, 60*5*1000)

contextBridge.exposeInMainWorld( 'api', {
  list: () => channels,

  off: () => {
    exec("vcgencmd display_power 0", (err, stdout, stderr) => { })
  },

  on: () => {
    exec("vcgencmd display_power 1", (err, stdout, stderr) => { })
  },

  log: f => {
    log = f
    log('test log')
    log(`${errors}`)
  },

  halt: () => {
    exec("sudo halt")
  },

  wpa_status: () => {
    return new Promise((res, rej) => {
      exec('wpa_cli status', (_, data) => {
        if (data.includes('DISCONNECTED')) {
          res(false)
        } else {
          res(true)
        }
      })
    })
  },

  wifi_list: () => {
    return new Promise((res, rej) => {
      exec('wpa_cli scan', (_1, _2) => {
        exec('wpa_cli scan_results', (err, data) => {
          const re = /..:..:..:.*/g
          const lst = [...data.matchAll(re)].map(_ => _[0].slice(1 + _[0].lastIndexOf('\t')))
          err && rej(err)
          !err && res(lst)
        })
      })
    })
  },

  wifi_connect: (ssid, key) => {
    return new Promise((res, rej) => {
      const entry = `network={\\n    ssid="${ssid}"\\n    psk="${key}"\\n    key_mgmt=WPA-PSK\\n}`
      exec(`sudo sed -i -e '$a\\\n${entry}' /etc/wpa_supplicant/wpa_supplicant.conf`, (err, _) => {
        err && rej(err)
        !err && exec('wpa_cli -i wlan0 reconfigure', (err, _) => {
          err && rej(err)
          !err && res(true)
        })
      })
    })
  },

  check_connection: () => {
    return new Promise((res, rej) => {
      got('https://google.com')
        .then(() => res(true))
        .catch(() => res(false))
    })
  },
})
