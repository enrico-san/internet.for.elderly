console.log('preload.js loaded')

import { contextBridge } from 'electron'

const got = require('got')
const { exec } = require('child_process')

let log = data => errors.push(data);
const errors = []

// window.addEventListener('DOMContentLoaded', () => {

// })

let guide = {}
let guide_callback = undefined


// **** TODO: update guide instead of replace

async function retrieve_guide() {
  try {
    const json_prom_1 = got(process.env.I4E_GUIDE_URL).json()
    guide = await json_prom_1
    log(guide)
    for (let el of Object.values(guide)) {
      const id = el.id
      let url
      if (el.playlist) {
        url = `https://www.youtube.com/oembed?url=https://www.youtube.com/playlist?list=${id}&format=json`
      } else {
        url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`
      }
      const json_prom_2 = got(url).json()
      const info = await json_prom_2
      Object.assign(el, info)
      log(el)
    }
    guide_callback && guide_callback()
  } catch (error) {
    log(error.response.body);
  }
}

retrieve_guide()
setInterval(() => {
  retrieve_guide()
}, 60*1*1000)

contextBridge.exposeInMainWorld( 'api', {
  set_guide_callback: (cb) => {
    guide_callback = cb
    guide_callback()
  },

  guide: () => guide,

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
      exec('sudo wpa_cli status', (_, data) => {
        if (data.includes('DISCONNECTED') || data.includes('INACTIVE')) {
          res(false)
        } else {
          res(true)
        }
      })
    })
  },

  wifi_list: () => {
    return new Promise((res, rej) => {
      exec('sudo wpa_cli scan', (_1, _2) => {
        exec('sudo wpa_cli scan_results', (err, data) => {
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
        !err && exec('sudo wpa_cli -i wlan0 reconfigure', (err, _) => {
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
