<template>
    <v-app>
        <div>
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
