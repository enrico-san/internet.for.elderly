<template>
  <v-container ma-0 pa-0>
    <div id="player"></div>
    <v-overlay :value="true" :opacity="opacity">
      <transition name="fade">
        <div class="pa-4" v-if="show_title" id="title">
          {{
            `${current_channel.choice} - ${guide[current_channel.choice].title}`
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
    power: false,
    current_channel: undefined,
    state: undefined,
    title_timeout: undefined,
    show_title: false,
    paused: false,
    startSeconds: undefined,
    wait: false,
    code: undefined,
    prev_code: undefined,
    keymap: window.api.keymap(),
  }),

  computed: {
    guide() {
      return this.$store.state.guide;
    },
  },

  methods: {
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

      window.api.log((v) => console.log(v));
    },

    onPlayerReady(e) {
      console.log(this.$youtube_state(e.target.getPlayerState()));
      this.ready = true;
      window.onkeydown = this.pre_listener;
    },

    onPlayerStateChange(e) {
      const stateN = e.target.getPlayerState();
      const state = this.$youtube_state(stateN);
      console.log(stateN, state);

      if (state === "ended") {
        const { playlist } = this.current_channel;
        const lastIndex = playlist ? this.player.getPlaylist().length - 1 : -1;
        const currentIndex = playlist ? this.player.getPlaylistIndex() : 0;
        const last = !playlist || currentIndex === lastIndex;
        if (last) {
          this.$nextTick(() => {
            if (playlist) {
              this.player.playVideoAt(0);
              this.player.pauseVideo();
              this.paused = true
              this.show_title = true;
            } else {
              this.player.seekTo(0);
              this.player.pauseVideo();
              this.paused = true
              this.show_title = false;
            }
          });
        }
      } else if (state === 'playing') {
        const { choice, playlist } = this.current_channel
        if (!playlist) {
          return
        }
        const time = this.guide[choice].currentTime
        const index = this.player.getPlaylistIndex()
        console.log(`choice ${choice}, index ${index}, time ${time}, startSeconds ${this.startSeconds}, duration ${this.player.getDuration()}`)
        
        if (this.startSeconds) {
          this.player.seekTo(this.startSeconds)
          this.startSeconds = undefined
        }
      }
    },

    save_current_time() {
      //eslint-disable-next-line no-undef
      if (this.current_channel && YT.PlayerState.PLAYING) {
        this.$store.dispatch("UPDATE_CURRENT_TIME", [
          this.current_channel.choice,
          this.player.playerInfo.currentTime,
          this.player.getPlaylistIndex()
        ]);
      }
    },

    toggle_channels() {
      if (this.current_channel !== undefined) {
        this.player.pauseVideo();
        this.current_channel = undefined;
      }
      this.show_guide = true;
      this.paused = false;
      this.show_title = false;
      this.opacity = 1;
    },

    pre_listener(e) {
      this.code = e.code
      const choice = this.keymap[this.code];
      
      // normal flow for non-channel choices
      if (this.guide[choice] === undefined || this.state) {
        this.prev_code = this.code
        this.listener(this.code)
        return
      }

      if (this.wait) {
        return
      }

      this.wait = true
      this.prev_code = this.code
      this.listener(this.code)

      setTimeout(() => {
        this.wait = false
        if (this.code !== this.prev_code) {
          this.pre_listener({code: this.code})
        }
      }, 4000)
    },

    listener(code) {
      const choice = this.keymap[code];

      const record = (obj) => {
        const preamble = {
          code,
          choice,
          power: this.power,
          ready: this.ready,
          show_guide: this.show_guide,
          current_channel: this.current_channel,
          state: this.state,
          player_state: this.player && this.player.getPlayerState(),
          player_current_time: this.player && this.player.getCurrentTime(),
        };
        window.api.record(Object.assign({}, obj, preamble));
      };

      // player not ready, ignore keypress
      if (!this.ready) {
        return;
      }

      console.log(code, "->", choice);

      // easter egg?
      if (this.state) {
        if (choice === this.state.shift(0)) {
          console.log(`easter seq: ${choice}`)
          if (this.state.length === 0) {
            console.log('halting')
            this.player.pauseVideo();
            record({ action: "halting" });
            window.api.halt();
          }
          return;
        } else {
          this.state = undefined;
          this.$nextTick(() => this.listener(code));
        }
        return;
      }

      if (choice === "easter") {
        console.log('easter')
        this.state = ["3", "1", "4", "1", "5"];
        return;
      } else {
        this.state = undefined;
      }

      if (choice === "power") {
        if (this.power) {
          this.save_current_time();
          if (this.current_channel) {
            this.player.pauseVideo();
          }
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

      if (choice == "pause" && !this.show_guide) {
        if (this.player.getPlayerState() === 1) {
          record({ action: "pause" });
          this.player.pauseVideo();
          this.paused = true
          this.show_title = true;
          this.startSeconds = undefined
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
        this.save_current_time();
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
      if (!this.guide || this.guide[choice] === undefined) {
        return;
      }

      const same =
        this.current_channel && choice === this.current_channel.choice;
      record({ action: "same channel" });
      if (same) {
        this.player.playVideo();
        this.paused = false
        this.show_title = false;
        return;
      }

      this.save_current_time();

      const { id, playlist } = this.guide[choice];
      record({ action: "change", new_channel: { choice, id, playlist } });

      this.current_channel = { choice, id, playlist };
      this.show_guide = false;
      this.opacity = 0;

      this.show_title = true;
      clearTimeout(this.title_timeout);
      this.title_timeout = setTimeout(() => {
        console.log('title off')
        this.show_title = false;
      }, 10000);

      if (playlist) {
        const index = this.guide[choice].index !== -1 ?this.guide[choice].index :0
        this.player.loadPlaylist({ list: id, listType: "playlist", index});
        this.startSeconds = this.guide[choice].currentTime
        console.log(`ch selected, startSecond=${this.startSeconds}`)
      } else {
        this.player.loadVideoById(id, this.guide[choice].currentTime);
      }
      this.paused = false
    },
  },
  mounted() {
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