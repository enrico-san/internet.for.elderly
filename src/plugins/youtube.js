const STATES = {
  '-1': 'unstarted',
  0: 'ended',
  1: 'playing',
  2: 'paused',
  3: 'buffering',
  5: 'video cued',
}

const plugin = {
  install(Vue) {
    let ready = false
    let ready_callback = () => {}

    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/player_api'

    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)

    window.onYouTubeIframeAPIReady = () => {
      ready = true
      ready_callback()
    }

    Vue.prototype.$youtube_create_player = (element_id, options) => {
      //eslint-disable-next-line no-undef
      let player = new YT.Player(element_id, options)
      return player
    }

    Vue.prototype.$youtube_on_api_ready = (cb) => {
      if (ready) {
        cb()
      } else {
        ready_callback = cb
      }
    }

    Vue.prototype.$youtube_state = n => STATES[n]
  },
}

export default plugin