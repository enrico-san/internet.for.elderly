<template>
  <v-app>
    <v-main v-show="scene==='player'">
      <div id="player"></div>
    </v-main>
    
    <v-overlay :opacity="opacity" v-show="scene==='player'">
      <transition name="fade">
        <div class="pa-4" v-if="show_title" id="title">
          {{
            `${choice} - ${guide[choice].title}`
          }}
        </div>
      </transition>

      <transition name="fade" opacity="0.7">
        <v-container v-if="paused" fill-height fluid>
          <v-row justify="center" no-gutters>
            <v-btn class="flashing" align-self="center">Pause <v-icon>mdi-pause</v-icon></v-btn>
          </v-row>
        </v-container>
      </transition>
    </v-overlay>
    
    <home v-show="scene==='guide'" />

    <v-main v-show="scene==='message'">
      <audio ref="tone" src="@/assets/message.mp3"></audio>
      <v-card
        class="mx-auto my-12"
        min-width="1300"
        max-width="1300"
      >
        <v-icon color="orange" size="100">mdi-bell-ring-outline</v-icon>

        <v-card-title class="pt-15"><h1>C'è un messaggio da {{message.sender}}! Vai sul canale 0 per sentirlo</h1></v-card-title>
      </v-card>
      <audio ref="audio" :src="message.url" @ended="media_play_ended"></audio>
    </v-main>
  </v-app>
</template>

<script>
import Home from "./Home.vue";
import {eventBus} from "../eventBus"

export default {
  name: "Player",
  components: {
    Home,
  },

  data: () => ({
    ch_info: {},  // <0..9>: {index of guide[].ids, time: {id: currentTime}}
    choice: undefined,
    easter: undefined,
    keymap: window.api.keymap(),
    last_key: {choice: '', t0: 0},
    opacity: 0,
    paused: false,
    play_tone_timeout: undefined,
    player: undefined,
    power: false,
    ready: false,
    scene: 'guide',  // player, guide, message
    show_title: false,
    sleep_timeout: undefined,
    title_timeout: undefined,
    was_playing: undefined,
    was_off: undefined,
  }),

  computed: {
    guide() {
      return this.$store.state.guide;
    },
    message() {
      return this.$store.getters.message
    },
    message_count() {
      return this.$store.getters.message_count
    },
    message_count_human() {
      if (this.message_count > 5) {
        return 'alcuni'
      } else {
        return ['zero', 'un', 'due', 'tre', 'quattro', 'cinque'][this.message_count]
      }
    }
  },

  methods: {
    admin(msg) {
      this.$ws.send(JSON.stringify({command: 'log', message: msg}))
    },

    got_message() {
      if (!this.message.isVoice) {
        this.$store.dispatch('MESSAGE_PLAYED')
        return
      }
      
      this.admin(`got message from ${this.message.sender}`)
      if (this.scene === 'message') {
        console.log('already in message scene')
        return
      }

      this.was_off = false
      this.was_playing = false
      if (!this.power) {
        console.log('from power off')
        this.listener({code: 'override'}, 'power')
        this.scene = 'message'
        this.was_off = true
      } else if (this.scene === 'player') {
        console.log('from playing')
        this.was_playing = true
        this.pause_playing()
        this.scene = 'message'
        this.$refs.tone.play()
        return
      } else {
        console.log('from other')
        this.scene = 'message'
      }

      let count = 1
      clearInterval(this.play_tone_timeout)
      this.play_tone_timeout = setInterval(() => {
        if (count-- !== 0) {
          console.log(this, this.$refs)
          this.$refs.tone.play()
        } else {
          clearInterval(this.play_tone_timeout)
        }
      }, 5000)
    },

    media_play_ended() {
      this.$store.dispatch('MESSAGE_PLAYED')
      if (this.power === false) {
        return
      }

      if (this.$store.getters.message.empty) {
        this.admin('listened all messages')

        if (this.was_off) {
          console.log('ended: was off')
          this.power && this.listener({code: 'override'}, 'power')
          this.scene = 'guide'
        } else if (this.was_playing) {
          console.log('ended: was playing')
          this.scene = 'player'
          this.paused = false
          this.player.playVideo();
        } else {
          console.log('ended: was other')
          this.scene = 'guide'
        }
      } else {
        clearInterval(this.play_tone_timeout)
        setTimeout(() => {
          this.$refs.audio.play()
        }, 2000)
      }
    },

    make_ch_info(ch) {
      this.ch_info[ch] = {index: 0, time: {}}
    },

    find_next_avail_channel(ch) {
      const avail = this.guide.slice(ch+1).filter(el => el.ids !== undefined)
      if (avail.length) {
        return avail[0].ch
      } else {
        return undefined
      }
    },

    find_prev_avail_channel(ch) {
      const avail = this.guide.slice(0, ch).filter(el => el.ids !== undefined)
      if (avail.length) {
        return avail.slice(-1)[0].ch
      } else {
        return undefined
      }
    },

    is_playing() {
      if (this.player === undefined || this.player.getPlayerState === undefined) {
        return false
      }
      return this.player.getPlayerState() === 1
    },

    video_id() {
      return this.player.getVideoData().video_id
    },

    create() {
      const options = {
        playerVars: { autoplay: 1, controls: 0, disablekb: 1 },
        width: screen.width,
        height: screen.height,
        events: {
          onReady: this.onPlayerReady,
          onStateChange: this.onPlayerStateChange,
        },
      };
      this.player = this.$youtube_create_player("player", options);
    },

    onPlayerReady() {
      this.ready = true;
      window.onkeydown = this.listener;
    },

    onPlayerStateChange(e) {
      const stateN = e.target.getPlayerState();
      const state = this.$youtube_state(stateN);
      console.log(stateN, state);

      if (state === "ended") {
        const ch = this.choice
        const last = this.guide[ch].ids.length - 1 === this.ch_info[ch].index
        if (last) {
          this.$nextTick(() => {
            this.ch_info[ch].index = 0
            this.ch_info[ch].time = {}
            this.toggle_channels()
          });
        } else {
          this.ch_info[ch].index++
          const index = this.ch_info[ch].index
          const id = this.guide[ch].ids[index]
          this.ch_info[this.choice].time[id] = 0
          this.load_and_play(this.choice)
        }
      }
    },

    save_current_time() {
      //eslint-disable-next-line no-undef
      if (this.is_playing()) {
        const id = this.player.getVideoData().video_id
        const time = this.player.playerInfo.currentTime
        this.ch_info[this.choice].time[id] = time
      }
    },

    toggle_channels() {
      this.player.pauseVideo();
      this.paused = false;
      this.choice = undefined;
      this.scene = 'guide';
      this.show_title = false;
      this.opacity = 1;
    },

    pause_playing() {
      this.player.pauseVideo();
      this.paused = true;
    },

    listener(e, choice_override) {
      const choice = choice_override ?choice_override :this.keymap[e.code];

      // block autorepeat except volume, forward/rewind
      const t1 = Date.now()
      const exceptions = ['volume-up', 'volume-down', 'forward', 'rewind'].includes(choice)
      const repeat = choice === this.last_key.choice
      const too_fast = t1 - this.last_key.t0 < 700
      if (!exceptions && repeat && too_fast) {
        this.last_key.t0 = t1
        return
      }
      this.last_key = {choice, t0: t1}

      if (!repeat) {
        this.admin(`pressed ${choice} (power was ${this.power ?'on' :'off'})`)
      }

      const record = (obj) => {
        const preamble = {
          version: window.api.version(),
          code: e.code,
          power: this.power,
          ready: this.ready,
          scene: this.scene,
          prev_choice: this.choice,
          choice,
          easter: this.easter,
          player_state: this.player && this.player.getPlayerState(),
          player_current_time: this.player && this.player.getCurrentTime(),
        };
        window.api.record(Object.assign({}, obj, preamble));
      };

      if (this.scene === 'message' && choice === 0) {
        this.admin('listening now')
        
        clearInterval(this.play_tone_timeout)
        this.$refs.audio.play()
        return
      } else if (this.scene === 'message' && choice > 0 && choice <= 9 && choice !== 'power') {
        // must read message before continuing
        return
      }

      // player not ready, ignore keypress
      if (!this.ready) {
        return;
      }

      console.log(e.code, "->", choice);

      // easter egg?
      if (this.easter) {
        if (choice === this.easter.shift(0)) {
          console.log(`easter seq: ${choice}`)
          if (this.easter.length === 0) {
            console.log('halting')
            this.player.pauseVideo();
            record({ action: "halting" });
            window.api.halt();
          }
          return;
        } else {
          this.easter = undefined;
          this.$nextTick(() => this.listener(e));
        }
        return;
      }

      if (choice === "easter") {
        console.log('easter')
        this.easter = [3, 1, 4, 1, 5];
        return;
      } else {
        this.easter = undefined;
      }

      if (choice === "power") {
        if (this.power) {
          this.admin('power off')
          this.scene = 'guide'
          this.player.pauseVideo();
          this.$refs.audio.pause()
          record({ action: "power off" });
          window.api.off();
          console.log("off");
          this.power = false;
        } else {
          this.admin('power on')
          record({ action: "power on" });
          window.api.on();
          console.log("on");
          this.power = true;
          if (this.message_count) {
            this.got_message()
          } else {
            this.toggle_channels();
          }
        }
        return;
      }

      if (!this.power) {
        if ((this.guide[choice] === undefined || this.guide[choice].ids === undefined)) {
          record({ action: "activity while off" });
          return
        } else {
          // turn on and continue with the given channel
          record({ action: "power on" })
          window.api.on();
          console.log("on")
          this.power = true
        }
      }

      if (choice === 'volume-up') {
        window.api.volume_up()
      } else if (choice === 'volume-down') {
        window.api.volume_down()
      }

      if (choice === 'next-channel' && this.scene === 'player' && this.choice !== undefined) {
        const ch = this.find_next_avail_channel(this.choice)
        if (ch !== undefined) {
          if (!(ch in this.ch_info)) {
            this.make_ch_info(ch)
          }
          record({ action: "change", new_channel: { ch, ...this.ch_info[ch] } });
          this.load_and_play(ch)
        }
      } else if (choice === 'prev-channel' && this.scene === 'player' && this.choice !== undefined) {
        const ch = this.find_prev_avail_channel(this.choice)
        if (ch !== undefined) {
          if (!(ch in this.ch_info)) {
            this.make_ch_info(ch)
          }
          record({ action: "change", new_channel: { ch, ...this.ch_info[ch] } });
          this.load_and_play(ch)
        }
      }

      if (choice == "pause" && this.scene === 'player') {
        if (this.is_playing()) {
          record({ action: "pause" });
          this.player.pauseVideo();
          this.paused = true
          this.show_title = true;
          clearTimeout(this.title_timeout)
        } else {
          record({ action: "unpause" });
          this.player.playVideo();
          this.paused = false
          this.show_title = false;
        }
        return;
      }

      if (choice == "channels") {
        record({ action: "guide" });
        this.toggle_channels();
        return;
      }

      if (choice === "rewind" && this.scene === 'player') {
        record({ action: "rewind" });
        this.player.seekTo(this.player.getCurrentTime() - 7);
        this.player.playVideo();
        this.paused = false
        this.show_title = false;
        return;
      } else if (choice === "forward" && this.scene === 'player') {
        record({ action: "forward" });
        this.player.seekTo(this.player.getCurrentTime() + 10);
        this.player.playVideo();
        this.paused = false
        this.show_title = false;
        return;
      }

      // after this, only numbers accepted
      if (this.guide[choice] === undefined) {
        return;
      }

      if (choice === this.choice) {
        this.admin('same channel')
        record({ action: "same channel" });
        this.scene = 'player'
        this.player.playVideo();
        this.paused = false
        this.show_title = false;
        return;
      }

      if (!(choice in this.ch_info)) {
        this.make_ch_info(choice)
      }
      record({ action: "change", new_channel: { choice, ...this.ch_info[choice] } });
      this.load_and_play(choice)
    },

    load_and_play(choice) {
      if (this.guide[choice].ids === undefined) {
        return
      }
      const index = this.ch_info[choice].index 
      const id = this.guide[choice].ids[index]
      const time = this.ch_info[choice].time[id]

      this.choice = choice;
      this.scene = 'player';
      this.opacity = 0;

      this.show_title = true;
      clearTimeout(this.title_timeout);
      this.title_timeout = setTimeout(() => {
        console.log('title off')
        this.show_title = false;
      }, 10000);

      this.player.loadVideoById(id, time);
      this.paused = false

      if (this.message_count) {
        this.got_message()
      }
    }
  },


  mounted() {
    this.admin('reboot')
    eventBus.$on('messages', () => {
      console.log('got messages')
      this.got_message()
    })

    window.api.log((v) => console.log(v));
    this.$youtube_on_api_ready(this.create);

    setInterval(() => this.save_current_time(), 5000)

    // sleep timer
    setInterval(() => {
      const will_sleep = this.sleep_timeout !== undefined
      const frozen = [0, 2].includes(this.player.getPlayerState()) || this.scene === 'guide'
      const on = this.power
      // console.log(`on ${on}, will_sleep ${will_sleep}, frozen ${frozen}`)
      if (on && (frozen)) {
        if (will_sleep) {
          return
        } else {
          clearTimeout(this.sleep_timeout)
          this.sleep_timeout = setTimeout(() => {
            this.admin('sleep')
            this.listener({code: 'override'}, 'power')
          }, 8*60*1000)
        }
      } else {
        // console.log('not now')
        clearTimeout(this.sleep_timeout)
        this.sleep_timeout = undefined
      }
    }, 1*60*1000)
  },
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
#title {
  position: fixed;
  top: 0px;
  left: 0px;
  background-color: black;
  color: white;
  font-size: 3rem !important;
  word-break: normal !important;
  line-height: 3rem !important;
}
@keyframes glowing {
  0% {
    background-color: #2ba805;
    box-shadow: 0 0 5px #2ba805;
  }
  50% {
    background-color: #3bbb14;
    box-shadow: 0 0 20px #3bbb14;
  }
  100% {
    background-color: #2ba805;
    box-shadow: 0 0 5px #2ba805;
  }
}
.flashing {
  animation: glowing 3000ms infinite;
}
</style>