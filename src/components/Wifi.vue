<template>
  <v-app>
    <v-container pt-8 pl-8 ma-0 xl fluid>
      <v-row v-for="a in available" :key="a.ch">
          <v-col class="" cols="1" align-self="end" align="center">
            <v-card class="elevated"
              ><h1>{{ a.ch }}</h1></v-card
            >
          </v-col>
          <v-col cols="11" align-self="end">
            <v-card>
              <v-card-title :class="choosen_service(a.ch - 1)">{{ a.service }}</v-card-title>
            </v-card>
          </v-col>
      </v-row>
    </v-container>
    
    <span>Password: {{letter}}</span>

    <div class="block_container">
      <span :class="evidence(i-1)" class="block pl-1 pr-1" v-for="i in symbols.length" :key="i">
        {{symbols[i-1]}}
      </span>
    </div>

    <span>{{tmp}}</span>
  </v-app>
</template>

<script>
export default {
  name: 'Wifi',

  data() {
    return {
      available: [{ch: 1, service: 'wifi 1'}, {ch: 2, service: 'wifi 2'}],
      current: 0,
      key: '',
      keymap: window.api.keymap(),
      letter: '',
      symbols: ['space'].concat(`\\|!"£$%&/()=?^'+*<>,.-;:_@0123456789AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz`.split('')),
      service: undefined,
      tmp: '',
    }
  },

  methods: {
    listener(e) {
      const choice = this.keymap[e.code]
      this.key = choice

      if (choice === 'forward' && this.current < this.symbols.length - 1) {
        this.current += 1
      }
      
      if (choice === 'rewind' && this.current > 0) {
        this.current -= 1
      }

      if (choice === 'pause') {
        this.letter += this.symbols[this.current]
      }

      if (choice === 'channels') {
        this.letter = this.letter.split('').slice(0,-1).join('')
      }

      if (choice === 0) {
        this.tmp = `${this.available[this.service].service} - ${this.letter}`
      }

      if (choice >= 1 && choice <= 9) {
        this.service = choice - 1
      }
    },

    evidence(i) {
      return i === this.current ?'underline' : ''
    },

    choosen_service(i) {
      return i === this.service ?'underline' : ''
    }
  },

  mounted() {
    window.onkeydown = this.listener
  },
}
</script>

<style scoped>
.block_container
{
    text-align:center;
}

.block
{
    display:inline;
}

.underline {
  text-decoration: underline;
}
</style>