<template>
    <v-app>
        <div>
            <v-toolbar>
                <v-toolbar-title @click="clicked()">Title</v-toolbar-title>

                <div class="flex-grow-1"></div>

            </v-toolbar>

            <home />
        </div>
    </v-app>
</template>

<script>
import Home from "./components/Home.vue";

export default {
    name: "App",
    components: {
        Home
    },
    methods: {
      clicked() {
        // console.log(ipcRenderer.sendSync('synchronous-message', 'ping'))
        window.api.list().then(console.log)
      }
    }
};
</script>

<style>
body {
    font-family: "Roboto, sans-serif";
}

.v-btn:not(.v-btn--round).v-size--large {
    font-size: 40px;
}
</style>
