<template>
  <v-app>
    <v-main>
      <v-container class="pt-8 pl-8 ma-0 xl">
        <v-row v-for="a in guide.value" :key="a.ch">
          <template v-if="a.ids !== undefined">
            <v-col class="" cols="3" align-self="end" align="center">
              <v-card class="elevated"
                ><h1>{{ a.ch }}</h1></v-card
              >
            </v-col>
            <v-col class="" cols="9" align-self="end">
              <v-card>
                <v-card-title>{{ a.title }}</v-card-title>
              </v-card>
            </v-col>
          </template>
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
      guide: computed(() => {
        return this.$store.state.guide
      }),
    };
  },
  methods: {},
};
</script>

<style scoped>
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
