<template>
  <v-container ma-0 pa-0>
    <div id="player"></div>
    <v-overlay :value="true" :opacity="opacity">
      <transition name="fade">
        <div class="pa-4" v-if="show_title" id="title">
          {{
            `${choice} - ${guide[choice].title}`
          }}
        </div>
      </transition>
      <transition name="fade" opacity="0.7">
        <v-container v-if="paused">
          <v-btn class="flashing" align-self="center">Pause <v-icon>mdi-pause</v-icon></v-btn>
        </v-container>
      </transition>
      <home v-show="show_guide" />
    </v-overlay>
  </v-container>
</template>

<script>
import Home from "./Home.vue";

export default {
  name: "Player",
  components: {
    Home,
  },

  data: () => ({
    player: undefined,
    ready: false,
    show_guide: true,
    opacity: 0,
    power: true,
    choice: undefined,
    easter: undefined,
    title_timeout: undefined,
    show_title: false,
    paused: false,
    wait: false,
    prev_code: undefined,
    keymap: window.api.keymap(),
    ch_info: {},  // <0..9>: {index, id, time}
  }),

  computed: {
    guide() {
      return this.$store.state.guide;
    },
  },

  methods: {
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
      return (this.player.getPlayerState() === 1)
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
        const last = this.ch_info[ch].ids.length - 1 === this.ch_info[ch].index
        if (last) {
          this.$nextTick(() => {
            this.player.seekTo(0);
            this.player.pauseVideo();
            this.paused = true
            this.show_title = false;
          });
        } else {
          this.ch_info[this.choice].index++
          this.ch_info[this.choice].time = 0
          this.load_and_play(this.choice)
        }
      }
    },

    save_current_time() {
      //eslint-disable-next-line no-undef
      if (this.player.getPlayerState() === 1) {
        this.ch_info[this.choice].time = this.player.playerInfo.currentTime
      }
    },

    toggle_channels() {
      this.player.pauseVideo();
      this.paused = false;
      this.choice = undefined;
      this.show_guide = true;
      this.show_title = false;
      this.opacity = 1;
    },

    listener(e) {
      this.code = e.code
      const choice = this.keymap[this.code];

      const record = (obj) => {
        const preamble = {
          code: this.code,
          power: this.power,
          ready: this.ready,
          show_guide: this.show_guide,
          prev_choice: this.choice,
          choice,
          easter: this.easter,
          player_state: this.player && this.player.getPlayerState(),
          player_current_time: this.player && this.player.getCurrentTime(),
        };
        window.api.record(Object.assign({}, obj, preamble));
      };

      // player not ready, ignore keypress
      if (!this.ready) {
        return;
      }

      console.log(this.code, "->", choice);

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
        this.easter = ["3", "1", "4", "1", "5"];
        return;
      } else {
        this.easter = undefined;
      }

      if (choice === "power") {
        if (this.power) {
          this.player.pauseVideo();
          record({ action: "power off" });
          window.api.off();
          console.log("off");
          this.power = false;
        } else {
          this.toggle_channels();
          record({ action: "power on" });
          window.api.on();
          console.log("on");
          this.power = true;
        }
        return;
      }

      if (!this.power) {
        record({ action: "activity while off" });
        return;
      }

      if (choice === 'volume-up') {
        window.api.volume_up()
      } else if (choice === 'volume-down') {
        window.api.volume_down()
      }

      if (choice === 'next-channel' && !this.show_guide && this.choice !== undefined) {
        const ch = this.find_next_avail_channel(this.choice)
        if (ch !== undefined) {
          if (!(ch in this.ch_info)) {
            this.ch_info[ch] = {index: 0, id: this.guide[ch].ids[0], time: 0}
          }
          record({ action: "change", new_channel: { ch, ...this.ch_info[ch] } });
          this.load_and_play(ch)
        }
      } else if (choice === 'prev-channel' && !this.show_guide && this.choice !== undefined) {
        const ch = this.find_prev_avail_channel(this.choice)
        if (ch !== undefined) {
          if (!(ch in this.ch_info)) {
            this.ch_info[ch] = {index: 0, id: this.guide[ch].ids[0], time: 0}
          }
          record({ action: "change", new_channel: { ch, ...this.ch_info[ch] } });
          this.load_and_play(ch)
        }
      }

      if (choice == "pause" && !this.show_guide) {
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

      if (choice === "rewind" && !this.show_guide) {
        record({ action: "rewind" });
        this.player.seekTo(this.player.getCurrentTime() - 7);
        this.player.playVideo();
        this.paused = false
        this.show_title = false;
        return;
      } else if (choice === "forward" && !this.show_guide) {
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
        record({ action: "same channel" });
        this.player.playVideo();
        this.paused = false
        this.show_title = false;
        return;
      }

      if (!(choice in this.ch_info)) {
        this.ch_info[choice] = {index: 0, id: this.guide[choice].ids[0], time: 0}
      }
      record({ action: "change", new_channel: { choice, ...this.ch_info[choice] } });
      this.load_and_play(choice)
    },

    load_and_play(choice) {
      const {id, time} = this.ch_info[choice]

      this.choice = choice;
      this.show_guide = false;
      this.opacity = 0;

      this.show_title = true;
      clearTimeout(this.title_timeout);
      this.title_timeout = setTimeout(() => {
        console.log('title off')
        this.show_title = false;
      }, 10000);

      this.player.loadVideoById(id, time);
      this.paused = false
    }
  },


  mounted() {
    window.api.log((v) => console.log(v));
    this.$youtube_on_api_ready(this.create);
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