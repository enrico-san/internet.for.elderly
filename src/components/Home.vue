<template>
  <v-app>
    <v-main>
      <v-container class="pt-8 pl-8 ma-0">
        <v-row v-for="([a, b], index) in channels.value" :key="index">
          <v-col class="" :cols="2">
            <v-card>
              <v-img :src="`https://img.youtube.com/vi/${a.id}/0.jpg`"></v-img>
            </v-card>
          </v-col>
          <v-col class="" :cols="1" align-self="end" align="center">
            <v-card class="elevated"
              ><h2>{{ a.ch }}</h2></v-card
            >
          </v-col>
          <v-col class="" :cols="3" align-self="end">
            <v-card>
              <v-card-title>{{ a.title }}</v-card-title>
            </v-card>
          </v-col>

          <v-col class="ml-0" :cols="2" v-if="b != undefined">
            <v-card>
              <v-img :src="`https://img.youtube.com/vi/${b.id}/0.jpg`"></v-img>
            </v-card>
          </v-col>
          <v-col
            class=""
            :cols="1"
            align-self="center"
            align="center"
            v-if="b != undefined"
          >
            <v-card class="elevated"
              ><h2>{{ b.ch }}</h2></v-card
            >
          </v-col>
          <v-col class="" :cols="3" v-if="b != undefined">
            <v-card>
              <v-card-title>{{ b.title }}</v-card-title>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { computed } from "@vue/composition-api";

export default {
  name: "Home",
  data() {
    return {
      channels: computed(() => {
        const lst = this.$store.getters["channels"];
        const splitted = [];
        const half = Math.ceil(lst.length / 2);
        for (let i = 0; i < half; i++) {
          splitted.push([lst[i], lst[half + i]]);
        }
        return splitted;
      }),
    };
  },
  methods: {},
};
</script>

<style>
body {
  font-family: "Roboto, sans-serif";
}

.v-btn:not(.v-btn--round).v-size--large {
  font-size: 40px;
}

.elevated {
  box-shadow: 0px 6px 6px -3px rgba(200, 200, 200, 0.2),
    0px 10px 14px 1px rgba(200, 200, 200, 0.14),
    0px 4px 18px 3px rgba(200, 200, 200, 0.12) !important;
}

.v-image {
  min-width: 5cm;
  min-height: 3cm;
  max-width: 5cm;
  max-height: 3cm;
}

.v-card {
  max-height: 3cm;
  overflow: hidden;
  text-overflow: ellipsis;
}

.v-card__text,
.v-card__title {
  word-break: normal !important;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
