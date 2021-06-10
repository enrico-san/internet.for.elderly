import { contextBridge } from 'electron'
import { appendFile, readFileSync } from 'fs'

const got = require('got')
const { exec } = require('child_process')

let log = data => errors.push(data);
const errors = []
let last_time = Date.now()

record({action: 'reboot'})

function record(obj) {
  const preamble = {
    ts: new Date(),
    seconds_passed: Math.round((Date.now() - last_time) / 1000),
  }
  last_time = Date.now()
  appendFile(process.env.APP_PATH + '/record.json', "  " + JSON.stringify(Object.assign(preamble, obj)) + "\n", () => {})
}

contextBridge.exposeInMainWorld( 'api', {
  volume_up() {
    exec("amixer -M set Master 10%+", (err, stdout, stderr) => { })
  },

  volume_down() {
    exec("amixer -M set Master 10%-", (err, stdout, stderr) => { })
  },

  keymap() {
    return JSON.parse(readFileSync(process.env.I4E_KEYMAP))
  },

  record,

  set_guide_callback: (cb) => {
    guide_callback = cb
    guide_callback()
  },

  guide() {
    let guide = []
    for(let i=0; i<100; i++) {
      guide.push({ch: i})
    }
    const _guide = JSON.parse(readFileSync(process.env.APP_PATH + '/guide.json'))
    _guide.forEach(el => {
      guide[el.ch] = el
    })

    return guide
  },

  off: () => {
    exec("vcgencmd display_power 0", (err, stdout, stderr) => { })
  },

  on: () => {
    exec("vcgencmd display_power 1", (err, stdout, stderr) => { })
  },

  log: f => {
    log = f
    log('test log')
    log(`${JSON.stringify(errors)}`)
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

  check_connectivity: () => {
    return new Promise((res, rej) => {
      got('https://google.com')
        .then(() => res(true))
        .catch(() => res(false))
    })
  },
})
