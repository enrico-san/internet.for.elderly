<template>
    <v-app>
        <div>
            <!-- <home /> -->
            <player />
        </div>
    </v-app>
</template>

<script>
// import Home from "./components/Home.vue"
import Player from "./components/Player.vue"

export default {
    name: "App",
    components: {
        // Home,
        Player,
    },
    methods: {
    },
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
