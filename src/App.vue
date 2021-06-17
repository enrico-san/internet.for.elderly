<template>
    <v-app>
        <div>
            <player v-if="has_internet" />
            <!-- <wifi v-else /> -->
        </div>
    </v-app>
</template>

<script>
// import Wifi from "./components/Wifi.vue"
import Player from "./components/Player.vue"

export default {
  name: "App",
  data() {
    return {
      has_internet: false,
    }
  },
  components: {
      Player,
      // Wifi
  },
  methods: {
    check_connectivity() {
      const that = this
      console.log('checking internet...')
      window.api.check_connectivity().then(ready => {
        if (!ready) {
          console.log('retry')
          setTimeout(that.check_connectivity, 10000)
        } else {
          console.log('done')
          this.has_internet = true
        }
      })
    },
  },
  mounted() {
    this.$store.dispatch('UPDATE_GUIDE')
    this.check_connectivity()
    window.api.off();
  }
};
</script>

<style>
.v-btn:not(.v-btn--round).v-size--large {
    font-size: 40px;
}

html, body {
    font-family: "Roboto, sans-serif";
    margin: 0;
    height: 100%;
    overflow: hidden;
    background-color: #121212;
    cursor: none;
}

body::-webkit-scrollbar { 
  display: none; 
}

</style>
