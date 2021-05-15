<template>
  <v-container ma-0 pa-0>
    <div id="player"></div>
    <v-overlay :value="true" opacity="0.5">
      <home v-show="guide" />
    </v-overlay>
  </v-container>
</template>

<script>
// <v-col v-show="false" cols="12">
//   <v-btn @click="visible = !visible">toggle</v-btn>
//   <v-btn @click="create()">create</v-btn>
//   <v-btn @click="player.loadVideoById('y47SBkxHQTs')">load video2</v-btn>
//   <v-btn @click="player.pauseVideo()">pause2</v-btn>
//   <v-btn @click="player.playVideo()">play2</v-btn>
// </v-col>
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
    guide: true,
    power: true,
    current_channel: undefined,
    state: undefined,
    channels: undefined,
    title_timeout: undefined,
  }),

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
      this.ready = true
      window.onkeydown = this.listener
    },

    onPlayerStateChange(e) {
      console.log(this.$youtube_state(e.target.getPlayerState()));
    },

    save_current_time() {
      //eslint-disable-next-line no-undef
      if (this.current_channel && YT.PlayerState.PLAYING) {
        this.channels[
          this.current_channel.choice
        ].currentTime = this.player.playerInfo.currentTime;
      }
    },

    toggle_channels() {
      if (this.current_channel !== undefined) {
        this.player.pauseVideo();
        this.current_channel = undefined;
      }
      this.guide = true
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
      if (!this.channels || this.channels[choice] === undefined) {
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

      const { id } = this.channels[choice];
      this.current_channel = { choice, id };
      clearTimeout(this.title_timeout);
      this.guide = false;
      this.player.loadVideoById(id, this.channels[choice].currentTime);
      this.player.playVideo();
    },
  },
  mounted() {
    this.$youtube_on_api_ready(this.create);
    this.channels = this.$store.getters.channels
  },
};
</script>

<style scoped>
</style>