<template>
  <v-container ma-0 pa-0>
        <div id="player2"></div>
  </v-container>
</template>

<script>
      // <v-col v-show="false" cols="12">
      //   <v-btn @click="log()">log</v-btn>
      //   <v-btn @click="visible = !visible">toggle</v-btn>
      //   <v-btn @click="create()">create</v-btn>
      //   <v-btn @click="player2.loadVideoById('y47SBkxHQTs')">load video2</v-btn>
      //   <v-btn @click="player2.pauseVideo()">pause2</v-btn>
      //   <v-btn @click="player2.playVideo()">play2</v-btn>
      // </v-col>

  export default {
    name: 'Player',

    data: () => ({
      player2: undefined,
    }),
    
    methods: {
      log() {
        console.log(this.$youtube_api_ready())
      },
      create() {
        const options = {
          playerVars: { 'autoplay': 1, 'controls': 0, 'disablekb': 1 },
          width: screen.width,
          height: screen.height,
          events: {
            'onReady': this.onPlayerReady,
            'onStateChange': this.onPlayerStateChange
          },
        }
        this.player2 = this.$youtube_create_player('player2', options)
      },
      onPlayerReady(e) {
        console.log(this.$youtube_state(e.target.getPlayerState()))
        e.target.loadVideoById('y47SBkxHQTs')
      },

      onPlayerStateChange(e) {
        console.log(this.$youtube_state(e.target.getPlayerState()))
      }

    },
    mounted() {
      this.$youtube_on_api_ready(this.create)
    }
  }
</script>
