<script setup>
import {useRouter} from "vue-router"
let router = useRouter()
</script>
<template>
    <div id="startPageBody">
        <p>Thank you for playing!</p>
    </div>
</template>
<style scoped>
#startPageBody{
    position: relative;
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

#startButton{
    margin-top: 2vw;
}
</style>