import { contextBridge } from 'electron'
import { writeFile, appendFile, readFileSync } from 'fs'

const got = require('got')
const { exec } = require('child_process')

let log = data => errors.push(data);
const errors = []
let last_time = Date.now()

record({action: 'reboot'})

// window.addEventListener('DOMContentLoaded', () => {

// })

let guide = []
for(let i=0; i<100; i++) {
  guide.push({ch: i})
}
let guide_callback = undefined

async function retrieve_guide() {
  log('in retrieve_guide')
  try {
    const new_guide = await got(process.env.I4E_GUIDE_URL).json()

    // clear guide
    guide.length = 0
    for(let i=0; i<100; i++) {
      guide.push({ch: i})
    }
        
    // populate guide
    for (let el of new_guide) {
      const ref = el.ref
      let url
      if (el.playlist) {
        url = `https://www.youtube.com/oembed?url=https://www.youtube.com/playlist?list=${ref}&format=json`
      } else {
        url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ref}&format=json`
      }
      const info = await got(url).json()
      Object.assign(el, info)
      guide[el.ch] = el
    }

    guide_callback && guide_callback()
  } catch (error) {
    log(error);
  }
}

retrieve_guide()
setInterval(() => {
  retrieve_guide()
}, 60*1*1000)

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

  update_current_time(key, time, index) {
    guide[key].currentTime = time
    guide[key].index = index
    guide_callback()
    log(`save guide[${key}]`)
    log(guide[key])
    writeFile(process.env.APP_PATH + "/guide.json", JSON.stringify(guide, undefined, 2), () => {})
  },
  
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
