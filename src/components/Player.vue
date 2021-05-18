<template>
  <v-container ma-0 pa-0>
    <div id="player"></div>
    <v-overlay :value="true" :opacity="opacity">
      <transition name="fade" @enter="enter_title">
        <div class="pa-4" v-if="show_title" id="title">{{`${current_channel.choice} - ${guide[current_channel.choice].title}`}}</div>
      </transition>
      <home v-show="show_guide" />
    </v-overlay>
  </v-container>
</template>

<script>
import Home from "./Home.vue";
const keymap = {
  "BrowserHome": 'power',
  "Tab": '',
  "LaunchMail": '',
  "LaunchApp2": 'easter',

  "NumLock": '',
  "NumpadDivide": '',
  "NumpadMultiply": '',
  "Backspace": 'channels',

  "Numpad7": '7',
  "Numpad8": '8',
  "Numpad9": '9',

  "Numpad4": '4',
  "Numpad5": '5',
  "Numpad6": '6',

  "Numpad1": '1',
  "Numpad2": '2',
  "Numpad3": '3',

  "Numpad0": '0',
  "Space": 'rewind',
  "NumpadDecimal": 'forward',

  "NumpadEnter": 'pause',
}


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
    current_channel: undefined,
    state: undefined,
    title_timeout: undefined,
    show_title: false,
  }),

  computed: {
    guide () {
      return this.$store.state.guide
    }
  },

  methods: {
    enter_title() {
      console.log('enter_title')
      clearTimeout(this.title_timeout)
      this.title_timeout = setTimeout(() => {this.show_title = false}, 5000)
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

      window.api.log((v) => console.log(v));
    },

    onPlayerReady(e) {
      console.log(this.$youtube_state(e.target.getPlayerState()));
      this.ready = true
      window.onkeydown = this.listener
    },

    onPlayerStateChange(e) {
      console.log(this.$youtube_state(e.target.getPlayerState()));
    },

    save_current_time() {
      //eslint-disable-next-line no-undef
      if (this.current_channel && YT.PlayerState.PLAYING) {
        this.$store.dispatch('UPDATE_CURRENT_TIME', [this.current_channel.choice, this.player.playerInfo.currentTime])
      }
    },

    toggle_channels() {
      if (this.current_channel !== undefined) {
        this.player.pauseVideo();
        this.current_channel = undefined;
      }
      this.show_guide = true
      this.opacity = 1
    },

    listener(e) {
      // player not ready, ignore keypress
      if (!this.ready) {
        return;
      }

      const choice = keymap[e.code];
      console.log(e.code, "->", choice);

      // easter egg?
      if (this.state) {
        if (choice === this.state.shift(0)) {
          console.log(this.state);
          if (this.state.length === 0) {
            this.player.pauseVideo();
            window.api.halt();
            console.log("halting");
          }
          return;
        } else {
          this.state = undefined;
          this.$nextTick(() => this.listener({ code: e.code }));
        }
        return;
      }

      if (choice === "easter") {
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
          window.api.off();
          console.log("off");
          this.power = false;
        } else {
          this.toggle_channels();
          window.api.on();
          console.log("on");
          this.power = true;
        }
        return;
      }

      if (!this.power) {
        return;
      }

      if (choice == "pause") {
        if (this.player.getPlayerState() === 1) {
          this.player.pauseVideo();
        } else {
          this.player.playVideo();
        }
        return;
      }

      if (choice == "channels") {
        this.save_current_time();
        this.toggle_channels();
        return;
      }

      if (choice === "rewind") {
        this.player.seekTo(this.player.getCurrentTime() - 7);
        this.player.playVideo();
        return;
      } else if (choice === "forward") {
        this.player.seekTo(this.player.getCurrentTime() + 10);
        this.player.playVideo();
        return;
      }

      // after this, only numbers accepted
      if (!this.guide || this.guide[choice] === undefined) {
        return;
      }

      const same =
        this.current_channel && choice === this.current_channel.choice;
      console.log(`same ${same}`);
      if (same) {
        this.player.playVideo();
        return;
      }

      this.save_current_time();

      const { id, playlist } = this.guide[choice];
      this.current_channel = { choice, id };
      this.show_title = true
      this.show_guide = false;
      this.opacity = 0
      if (playlist) {
        this.player.loadPlaylist({list: id, listType: 'playlist'});  // TODO: add currentTime
      } else {
        this.player.loadVideoById(id, this.guide[choice].currentTime);
      }
      this.player.playVideo();
    },

    guide_updated() {
      this.$store.dispatch('UPDATE_GUIDE')
    }
  },
  mounted() {
    this.$youtube_on_api_ready(this.create);
    window.api.set_guide_callback(this.guide_updated)
  },
};
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity .3s;
}
.fade-enter, .fade-leave-to {
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

</style>